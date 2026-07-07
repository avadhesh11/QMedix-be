import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';

describe('Auth API - Login & Session Management', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Patient Login', () => {
    test('Login success (Patient)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'patient-123' },
          session: { access_token: 'pat-access-token', refresh_token: 'pat-refresh-token' }
        },
        error: null
      });

      supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({
        data: { id: 'patient-123', name: 'Test Patient', email: 'patient@test.com' },
        error: null
      }));

      const res = await request(app)
        .post('/auth/login/patient')
        .send({ email: 'patient@test.com', password: 'QMedix@123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.role).toBe('patient');
      expect(res.body.patient.email).toBe('patient@test.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('Login failure (Patient)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials')
      });

      const res = await request(app)
        .post('/auth/login/patient')
        .send({ email: 'patient@test.com', password: 'WrongPassword' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Doctor Login', () => {
    test('Login success (Doctor)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'doctor-123' },
          session: { access_token: 'doc-access-token', refresh_token: 'doc-refresh-token' }
        },
        error: null
      });

      supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({
        data: { id: 'doctor-123', name: 'Dr. Test', email: 'doctor@test.com' },
        error: null
      }));

      const res = await request(app)
        .post('/auth/login/doctor')
        .send({ email: 'doctor@test.com', password: 'QMedix@123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.role).toBe('doctor');
    });

    test('Login failure (Doctor)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      });

      const res = await request(app)
        .post('/auth/login/doctor')
        .send({ email: 'doctor@test.com', password: 'wrong' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Staff Login', () => {
    test('Login success (Staff)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'staff-123' },
          session: { access_token: 'staff-access-token', refresh_token: 'staff-refresh-token' }
        },
        error: null
      });

      supabase.from("Staff").then.mockImplementationOnce((resolve) => resolve({
        data: { id: 'staff-123', name: 'Test Staff', email: 'staff@test.com' },
        error: null
      }));

      const res = await request(app)
        .post('/auth/login/hospital-staff')
        .send({ email: 'staff@test.com', password: 'QMedix@123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.role).toBe('hospital-staff');
    });

    test('Login failure (Staff)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      });

      const res = await request(app)
        .post('/auth/login/hospital-staff')
        .send({ email: 'staff@test.com', password: 'wrong' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Hospital Admin Login', () => {
    test('Login success (Admin)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'admin-123' },
          session: { access_token: 'admin-access-token', refresh_token: 'admin-refresh-token' }
        },
        error: null
      });

      supabase.from("Hospital").then.mockImplementationOnce((resolve) => resolve({
        data: { id: 'admin-123', name: 'Hospital Admin', email: 'admin@test.com' },
        error: null
      }));

      const res = await request(app)
        .post('/auth/login/hospital')
        .send({ email: 'admin@test.com', password: 'QMedix@123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.role).toBe('hospital');
    });

    test('Login failure (Admin)', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      });

      const res = await request(app)
        .post('/auth/login/hospital')
        .send({ email: 'admin@test.com', password: 'wrong' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});