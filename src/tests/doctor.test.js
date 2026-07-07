import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';
import { redisClient } from '../utils/redis.js';

describe('Doctor Services & Endpoints', () => {
  let cookies;

  beforeEach(() => {
    jest.clearAllMocks();
    cookies = ['access_token=mock-doctor-token'];
  });

  describe('Doctor Availability Toggle', () => {
    test('Toggle availability should succeed (doctor only)', async () => {
      // Mock get user
      supabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'doctor-123',
            user_metadata: { role: 'doctor' }
          }
        },
        error: null
      });

      // Mock get profile / toggle select/update
      // First select in toggle service, then update
      supabase.from("Doctor").then
        .mockImplementationOnce((resolve) => resolve({
          data: { isAvailable: false, hospital_id: 'hospital-456' },
          error: null
        }))
        .mockImplementationOnce((resolve) => resolve({
          data: { id: 'doctor-123', isAvailable: true },
          error: null
        }));

      // Mock redis del
      redisClient.del.mockResolvedValueOnce(1);

      const res = await request(app)
        .post('/doctor/toggle-availability')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Doctor Availability toggled.');
      expect(supabase.from).toHaveBeenCalledWith('Doctor');
      expect(redisClient.del).toHaveBeenCalledWith('doctors:hospital-456');
    });

    test('Toggle availability WITHOUT login should fail', async () => {
      const res = await request(app)
        .post('/doctor/toggle-availability');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Get All Doctors for Hospital', () => {
    test('Should return doctors from cache on cache hit', async () => {
      const cachedDoctors = [{ id: 'doc-1', name: 'Dr. Cache' }];
      redisClient.get.mockResolvedValueOnce(JSON.stringify(cachedDoctors));

      const res = await request(app)
        .get('/doctor/all/hospital-123');

      expect(res.statusCode).toBe(200);
      expect(res.body.doctors).toEqual(cachedDoctors);
      expect(redisClient.get).toHaveBeenCalledWith('doctors:hospital-123');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('Should query database and populate cache on cache miss', async () => {
      const dbDoctors = [{ id: 'doc-1', name: 'Dr. Db' }];
      redisClient.get.mockResolvedValueOnce(null);
      
      supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({ data: dbDoctors, error: null }));
      redisClient.set.mockResolvedValueOnce('OK');

      const res = await request(app)
        .get('/doctor/all/hospital-123');

      expect(res.statusCode).toBe(200);
      expect(res.body.doctors).toEqual(dbDoctors);
      expect(supabase.from).toHaveBeenCalledWith('Doctor');
      expect(redisClient.set).toHaveBeenCalledWith(
        'doctors:hospital-123',
        JSON.stringify(dbDoctors),
        { EX: 300 }
      );
    });
  });

  describe('Mark Appointment Complete', () => {
    test('Should complete appointment with valid payload', async () => {
      const payload = {
        appointmentId: 'appt-123',
        remarks: 'Follow up in 2 weeks',
        completed_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      };

      const mockCompletedAppointment = { id: 'appt-123', status: 'completed', remarks: payload.remarks };
      supabase.from("Appointment").then.mockImplementationOnce((resolve) => resolve({ data: mockCompletedAppointment, error: null }));

      const res = await request(app)
        .post('/doctor/mark-complete')
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCompletedAppointment);
      expect(supabase.from).toHaveBeenCalledWith('Appointment');
      expect(supabase.from('Appointment').update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
        remarks: payload.remarks
      }));
    });

    test('Should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/doctor/mark-complete')
        .send({ appointmentId: 'appt-123' }); // missing dates

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });
});
