import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';
import { redisClient } from '../utils/redis.js';

describe('Auth Signup, Approvals, Profile, and Session API', () => {
  let cookies;

  beforeEach(() => {
    jest.clearAllMocks();
    cookies = ['access_token=mock-admin-token'];
  });

  describe('Signups', () => {
    test('Patient signup should succeed with valid data', async () => {
      supabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'patient-999' },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        },
        error: null
      });

      // Insert patient query inside PatientSignin
      const mockPatient = { id: 'patient-999', name: 'John Signup', email: 'john@signup.com' };
      supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({
        data: mockPatient,
        error: null
      }));

      const res = await request(app)
        .post('/auth/signup/patient')
        .send({
          name: 'John Signup',
          email: 'john@signup.com',
          phone: '1234567890',
          password: 'Password123',
          address: '123 Main St',
          dob: '1995-04-12',
          gender: 'male'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('patient signup successful');
      expect(res.body.patient.Patient).toEqual(mockPatient);
    });

    test('Doctor signup should succeed and insert approval request', async () => {
      supabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'doctor-pending' },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        },
        error: null
      });

      // Insert request query inside DoctorSignin
      const mockRequest = { id: 'doctor-pending', role: 'doctor', hospital_id: 'hosp-123' };
      supabase.from("Approval_Requests").then.mockImplementationOnce((resolve) => resolve({
        data: mockRequest,
        error: null
      }));

      redisClient.del.mockResolvedValueOnce(1);

      const res = await request(app)
        .post('/auth/signup/doctor')
        .send({
          name: 'Dr. Pending',
          email: 'dr.pending@test.com',
          phone: '1234567890',
          password: 'Password123',
          address: 'Doctor Clinic',
          speciality: 'Cardiology',
          hospital_id: 'hosp-123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Doctor registration request send successfully.');
      expect(redisClient.del).toHaveBeenCalledWith('doctor:hosp-123');
    });

    test('Hospital signup should succeed and clear hospital list cache', async () => {
      supabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'hosp-new' },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        },
        error: null
      });

      const mockHospital = { id: 'hosp-new', name: 'New Hospital' };
      supabase.from("Hospital").then.mockImplementationOnce((resolve) => resolve({
        data: mockHospital,
        error: null
      }));

      redisClient.del.mockResolvedValueOnce(1);

      const res = await request(app)
        .post('/auth/signup/hospital')
        .send({
          name: 'New Hospital',
          email: 'new@hosp.com',
          phone: '1234567890',
          password: 'Password123',
          address: 'Hospital Street'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('hospital signin succesfull');
      expect(redisClient.del).toHaveBeenCalledWith('allHospitals');
    });

    test('Staff signup should succeed and insert approval request', async () => {
      supabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'staff-pending' },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        },
        error: null
      });

      const mockRequest = { id: 'staff-pending', role: 'hospital-staff', hospital_id: 'hosp-123' };
      supabase.from("Approval_Requests").then.mockImplementationOnce((resolve) => resolve({
        data: mockRequest,
        error: null
      }));

      const res = await request(app)
        .post('/auth/signup/hospital-staff')
        .send({
          hospital_id: 'hosp-123',
          name: 'Staff Pending',
          email: 'staff.pending@test.com',
          phone: '1234567890',
          password: 'Password123',
          dept: 'Pharmacy'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Staff registration request send succesfully.');
    });
  });

  describe('Approvals and Rejections', () => {
    test('Approve doctor should succeed and insert doctor record', async () => {
      // Authenticate as Hospital
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'hospital-admin-id' } },
        error: null
      });

      // ApproveDoctor db calls:
      // 1. Fetch from Approval_Requests
      // 2. Update status to APPROVED in Approval_Requests
      supabase.from("Approval_Requests").then
        .mockImplementationOnce((resolve) => resolve({
          data: { id: 'doctor-req', role: 'doctor', status: 'PENDING', name: 'Dr. Approved', hospital_id: 'hospital-admin-id' },
          error: null
        }))
        .mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));

      // 3. Insert into Doctor
      const mockDoc = { id: 'doctor-req', name: 'Dr. Approved' };
      supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({
        data: mockDoc,
        error: null
      }));

      const res = await request(app)
        .post('/auth/approve/doctor/doctor-req')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Doctor Approved.');
      expect(res.body.details).toEqual(mockDoc);
    });

    test('Reject request should succeed and delete auth user', async () => {
      // Authenticate
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'hospital-admin-id' } },
        error: null
      });

      // RejectRequest db calls:
      // 1. Fetch from Approval_Requests
      // 2. Update status to REJECTED in Approval_Requests
      supabase.from("Approval_Requests").then
        .mockImplementationOnce((resolve) => resolve({
          data: { id: 'rejected-user-id', role: 'doctor', status: 'PENDING', hospital_id: 'hospital-admin-id' },
          error: null
        }))
        .mockImplementationOnce((resolve) => resolve({ data: {}, error: null }));
      
      // Mock supabase.auth.admin.deleteUser (which was fixed from supabaseAdmin.auth.admin.deleteUser)
      supabase.auth = {
        ...supabase.auth,
        admin: {
          deleteUser: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }
      };

      const res = await request(app)
        .post('/auth/reject/rejected-user-id')
        .set('Cookie', cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Request Rejected Successfully.');
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('rejected-user-id');
    });
  });

  describe('Session Management & Profile', () => {
    test('Get Me profile should return user profile details', async () => {
      // Authenticate
      supabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'patient-123',
            user_metadata: { role: 'patient' }
          }
        },
        error: null
      });

      // Query from Patient table
      const mockPatientProfile = { id: 'patient-123', name: 'John Doe', email: 'john@doe.com' };
      supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({
        data: mockPatientProfile,
        error: null
      }));

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', ['access_token=mock-token']);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('user fetched');
      expect(res.body.user).toEqual({ ...mockPatientProfile, role: 'patient' });
    });

    test('Update profile should return 201', async () => {
      // Authenticate
      supabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'patient-123',
            user_metadata: { role: 'patient' }
          }
        },
        error: null
      });

      // Update query
      supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({
        data: { id: 'patient-123', name: 'Updated Name' },
        error: null
      }));

      const res = await request(app)
        .put('/auth/update')
        .set('Cookie', ['access_token=mock-token'])
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Profile updated');
    });

    test('Refresh session should set new cookies', async () => {
      // Mock refreshSession
      supabase.auth.refreshSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'new-access',
            refresh_token: 'new-refresh'
          }
        },
        error: null
      });

      const res = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=old-refresh']);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Access token refreshed');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('Logout should clear cookies', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });
});
