import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';

describe('Staff Endpoints & Services', () => {
  let cookies;

  beforeEach(() => {
    jest.clearAllMocks();
    cookies = ['access_token=mock-staff-token'];

    // Default mock for authentication (getUser)
    supabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'staff-123',
          user_metadata: { role: 'hospital-staff' }
        }
      },
      error: null
    });

    // Default mock for authorizeRole("Staff") middleware query
    supabase.from("Staff").then.mockImplementation((resolve) => resolve({
      data: { id: 'staff-123', hospital_id: 'hospital-123' },
      error: null
    }));
  });

  describe('Cancel Appointment', () => {
    test('Should return success message when appointment is deleted', async () => {
      const fakeDeletedData = [{ id: 'app-1' }];
      supabase.from("Appointment").then.mockImplementationOnce((resolve) => resolve({ data: fakeDeletedData, error: null }));

      const res = await request(app)
        .delete('/staff/cancel-appointment/app-1')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Appointment deleted successfully.');
      expect(res.body.details).toEqual(fakeDeletedData);
      expect(supabase.from).toHaveBeenCalledWith('Appointment');
    });

    test('Should return error message if appointment not found', async () => {
      supabase.from("Appointment").then.mockImplementationOnce((resolve) => resolve({ data: [], error: null }));

      const res = await request(app)
        .delete('/staff/cancel-appointment/invalid-app')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('No such appointment exists.');
    });
  });

  describe('Emergency Controls', () => {
    test('Should toggle emergency status successfully', async () => {
      // 1. Select current status, 2. Perform update on Appointment
      supabase.from("Appointment").then
        .mockImplementationOnce((resolve) => resolve({ data: { isEmergency: false }, error: null }))
        .mockImplementationOnce((resolve) => resolve({ data: { id: 'app-1' }, error: null }));

      const res = await request(app)
        .post('/staff/toggle-emergency/app-1')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Appointment Emergency status toggled successfully.');
      expect(supabase.from('Appointment').update).toHaveBeenCalledWith({ isEmergency: true });
    });

    test('Should approve emergency request', async () => {
      // 1. Update status in Emergency_Requests
      supabase.from("Emergency_Requests").then.mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));
      // 2. Update isEmergency in Appointment
      supabase.from("Appointment").then.mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));

      const res = await request(app)
        .post('/staff/approve-emergency/app-1')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Emergency request approved successfully.');
      expect(supabase.from).toHaveBeenCalledWith('Emergency_Requests');
      expect(supabase.from).toHaveBeenCalledWith('Appointment');
    });

    test('Should reject emergency request', async () => {
      // Update status in Emergency_Requests
      supabase.from("Emergency_Requests").then.mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));

      const res = await request(app)
        .post('/staff/reject-emergency/app-1')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Appointment Emergency Requests Rejected Successfully.');
    });

    test('Should fetch list of emergencies for a hospital', async () => {
      const mockEmergencies = [{ appointment_id: 'app-1', status: 'PENDING' }];
      supabase.from("emergency_requests_view").then.mockImplementationOnce((resolve) => resolve({ data: mockEmergencies, error: null }));

      const res = await request(app)
        .get('/staff/emergency-requests/hospital-123')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockEmergencies);
      expect(supabase.from).toHaveBeenCalledWith('emergency_requests_view');
    });
  });

  describe('Register Walk-in Patient', () => {
    test('Should successfully register walk-in patient and book appointment', async () => {
      const mockAppt = { id: 'appt-walkin', patient_id: 'patient-999', pref_doctor: 'doc-123' };

      // 1. Insert patient
      supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({ data: { id: 'patient-999', name: 'Walk-in John' }, error: null }));
      
      // 2. Select doctors existing appointments, 3. Insert new appointment
      supabase.from("Appointment").then
        .mockImplementationOnce((resolve) => resolve({ data: [], error: null }))
        .mockImplementationOnce((resolve) => resolve({ data: mockAppt, error: null }));

      const res = await request(app)
        .post('/staff/register-walkin')
        .set('Cookie', cookies)
        .send({
          patient_name: 'Walk-in John',
          doctor_id: 'doc-123',
          hospital_id: 'hospital-123',
          phone: '1234567890',
          gender: 'male',
          dob: '1990-01-01',
          address: 'Main Street'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Walk-in registered successfully');
      expect(res.body.details).toEqual(mockAppt);
      expect(supabase.from).toHaveBeenCalledWith('Patient');
      expect(supabase.from).toHaveBeenCalledWith('Appointment');
    });
  });
});
