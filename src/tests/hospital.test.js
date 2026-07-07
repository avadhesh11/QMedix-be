import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';
import { redisClient } from '../utils/redis.js';

describe('Hospital Endpoints & Services', () => {
  let cookies;

  beforeEach(() => {
    jest.clearAllMocks();
    cookies = ['access_token=mock-hospital-token'];

    // Default mock for authentication (getUser)
    supabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'hospital-123',
          user_metadata: { role: 'hospital' }
        }
      },
      error: null
    });

    // Default mock for authorizeRole("Hospital") middleware query (Hospital profile lookup)
    supabase.from("Hospital").then.mockImplementation((resolve) => resolve({
      data: { id: 'hospital-123', name: 'Mock Hospital' },
      error: null
    }));
  });

  describe('Get All Hospitals', () => {
    test('Should fetch hospitals from cache on hit', async () => {
      const cachedHospitals = [{ id: 'hosp-1', name: 'Cached Hospital' }];
      redisClient.get.mockResolvedValueOnce(JSON.stringify(cachedHospitals));

      const res = await request(app)
        .get('/hospital/all');

      expect(res.statusCode).toBe(200);
      expect(res.body.hospitals).toEqual(cachedHospitals);
      expect(redisClient.get).toHaveBeenCalledWith('allHospitals');
    });

    test('Should query database and save to cache on miss', async () => {
      const dbHospitals = [{ id: 'hosp-1', name: 'Db Hospital' }];
      redisClient.get.mockResolvedValueOnce(null);
      
      // Override Hospital table query for this test to return lists instead of admin profile
      supabase.from("Hospital").then.mockImplementationOnce((resolve) => resolve({
        data: dbHospitals,
        error: null
      }));
      redisClient.set.mockResolvedValueOnce('OK');

      const res = await request(app)
        .get('/hospital/all');

      expect(res.statusCode).toBe(200);
      expect(res.body.hospitals).toEqual(dbHospitals);
      expect(supabase.from).toHaveBeenCalledWith('Hospital');
      expect(redisClient.set).toHaveBeenCalledWith(
        'allHospitals',
        JSON.stringify(dbHospitals),
        { EX: 86400 }
      );
    });
  });

  describe('Pending Approvals', () => {
    test('Should return pending approval requests', async () => {
      const pendingRequests = [{ id: 'req-1', role: 'doctor', status: 'PENDING' }];
      
      // Mock Approval_Requests table builder
      supabase.from("Approval_Requests").then.mockImplementationOnce((resolve) => resolve({
        data: pendingRequests,
        error: null
      }));

      const res = await request(app)
        .get('/hospital/approvals')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(pendingRequests);
      expect(supabase.from).toHaveBeenCalledWith('Approval_Requests');
    });
  });

  describe('Get All Staff Details', () => {
    test('Should return combined staff and doctor data', async () => {
      const staffList = [{ id: 'staff-1', name: 'Staff A' }];
      const doctorList = [{ id: 'doc-1', name: 'Doc A' }];

      // Mock database queries on respective tables
      supabase.from("Staff").then.mockImplementationOnce((resolve) => resolve({ data: staffList, error: null }));
      supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({ data: doctorList, error: null }));

      const res = await request(app)
        .get('/hospital/get-all-staff')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual([
        { id: 'staff-1', name: 'Staff A', role: 'staff' },
        { id: 'doc-1', name: 'Doc A', role: 'doctor' }
      ]);
    });
  });

  describe('Save OPD Stats', () => {
    test('Should successfully save OPD records', async () => {
      supabase.from("Daily_OPDs").then.mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));

      const res = await request(app)
        .post('/hospital/save-opd')
        .set('Cookie', cookies)
        .send({ date: '2026-07-07', patients_count: 45 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('OPD Saved Successfully.');
      expect(supabase.from).toHaveBeenCalledWith('Daily_OPDs');
    });
  });

  describe('Dashboard Analytics', () => {
    test('Should retrieve analytics data', async () => {
      const mockStats = [{ date: '2026-07-07', patients_count: 45 }];
      supabase.from("Daily_OPDs").then.mockImplementationOnce((resolve) => resolve({ data: mockStats, error: null }));

      const res = await request(app)
        .get('/hospital/dashboard/opd')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockStats);
    });
  });
});
