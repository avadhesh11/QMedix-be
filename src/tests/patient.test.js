import request from 'supertest';
import { jest } from '@jest/globals';

// Set up mocks at the top of the file
jest.mock('../utils/supabase.js', () => jest.requireActual('../utils/__mocks__/supabase.js'));
jest.mock('../utils/redis.js', () => jest.requireActual('../utils/__mocks__/redis.js'));

import app from '../app.js';
import { supabase } from '../utils/supabase.js';

describe('Patient Appointment API', () => {
  let cookies;

  beforeEach(() => {
    jest.clearAllMocks();
    cookies = ['access_token=mock-patient-token'];
    
    // Default authentication mock
    supabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'patient-123',
          user_metadata: { role: 'patient' }
        }
      },
      error: null
    });
  });

  test('Book appointment WITHOUT login should fail', async () => {
    const res = await request(app)
      .post('/patient/book-appointment')
      .send({
        pref_doctor: 'doc-123',
        hospital_id: 'hosp-123',
        department: 'Cardiology',
        bookingDate: '2026-07-08',
        timeSlot: '10:00 AM',
        isEmergency: false,
      });

    expect(res.statusCode).toBe(401);
  });

  test('Book appointment WITH login should succeed', async () => {
    const mockAppt = { id: 'appt-999', pref_doctor: 'doc-123', assigned_doctor: 'doc-123', hospital_id: 'hosp-123', patient_id: 'patient-123', booked_for: '2026-07-08T10:00:00.000Z', status: 'waiting' };

    // Queries to Appointment: 1. Select existing, 2. Insert new
    supabase.from("Appointment").then
      .mockImplementationOnce((resolve) => resolve({ data: [], error: null }))
      .mockImplementationOnce((resolve) => resolve({ data: mockAppt, error: null }));

    // Query to Doctor: Select available doctors
    supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({
      data: [{ id: 'doc-123', hospital_id: 'hosp-123', speciality: 'Cardiology', isAvailable: true }],
      error: null
    }));

    const res = await request(app)
      .post('/patient/book-appointment')
      .set('Cookie', cookies)
      .send({
        pref_doctor: 'doc-123',
        hospital_id: 'hosp-123',
        department: 'Cardiology',
        bookingDate: '2026-07-08',
        timeSlot: '10:00 AM',
        isEmergency: false,
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.message).toBe('Appointment booked successfully');
    expect(res.body.details).toEqual(mockAppt);
  });

  test('Cancel appointment should succeed', async () => {
    const mockDeletedAppt = [{ id: 'appt-123', patient_id: 'patient-123' }];
    supabase.from("Appointment").then.mockImplementationOnce((resolve) => resolve({
      data: mockDeletedAppt,
      error: null
    }));

    const res = await request(app)
      .delete('/patient/cancel-appointment/appt-123')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Appointment deleted successfully.');
    expect(res.body.details).toEqual(mockDeletedAppt);
    expect(supabase.from).toHaveBeenCalledWith('Appointment');
  });

  test('Update appointment should succeed', async () => {
    const mockAppt = { id: 'appt-new', pref_doctor: 'doc-123', assigned_doctor: 'doc-123', hospital_id: 'hosp-123', patient_id: 'patient-123', status: 'waiting' };

    // Queries to Appointment: 1. Delete old, 2. Select existing, 3. Insert new
    supabase.from("Appointment").then
      .mockImplementationOnce((resolve) => resolve({ data: [{ id: 'appt-123' }], error: null }))
      .mockImplementationOnce((resolve) => resolve({ data: [], error: null }))
      .mockImplementationOnce((resolve) => resolve({ data: mockAppt, error: null }));

    // Query to Doctor: Select available
    supabase.from("Doctor").then.mockImplementationOnce((resolve) => resolve({
      data: [{ id: 'doc-123', hospital_id: 'hosp-123', speciality: 'Cardiology', isAvailable: true }],
      error: null
    }));

    const res = await request(app)
      .post('/patient/update-appointment/appt-123')
      .set('Cookie', cookies)
      .send({
        pref_doctor: 'doc-123',
        hospital_id: 'hosp-123',
        department: 'Cardiology',
        bookingDate: '2026-07-08',
        timeSlot: '11:00 AM',
        isEmergency: false,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Appointment Updated Successfully.');
    expect(res.body.details).toEqual(mockAppt);
  });

  test('Get appointments should fetch patient appointments', async () => {
    const mockAppts = [{ id: 'appt-1', patient_id: 'patient-123', status: 'waiting' }];
    supabase.from("patient_appointment_view").then.mockImplementationOnce((resolve) => resolve({
      data: mockAppts,
      error: null
    }));

    const res = await request(app)
      .get('/patient/get-appointments')
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Appointments fetched successfully.');
    expect(res.body.data).toEqual(mockAppts);
    expect(supabase.from).toHaveBeenCalledWith('patient_appointment_view');
  });

  test('Get batch details should succeed with valid patient IDs', async () => {
    const dbPatients = [
      { id: 'pat-1', name: 'John Doe', dob: '1990-01-01', gender: 'male', phone: '1234567890' },
      { id: 'pat-2', name: 'Jane Smith', dob: '1985-05-15', gender: 'female', phone: '9876543210' }
    ];
    supabase.from("Patient").then.mockImplementationOnce((resolve) => resolve({
      data: dbPatients,
      error: null
    }));

    const res = await request(app)
      .post('/patient/batch-details')
      .set('Cookie', cookies)
      .send({ ids: ['pat-1', 'pat-2'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.patients).toBeDefined();
    expect(res.body.patients.length).toBe(2);
    expect(res.body.patients[0].name).toBe('John Doe');
    expect(res.body.patients[0].gender).toBe('Male'); // formatted gender
    expect(res.body.patients[0].age).toBeDefined(); // computed age
  });

  test('Get batch details should fail if ids array is missing', async () => {
    const res = await request(app)
      .post('/patient/batch-details')
      .set('Cookie', cookies)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ids array is required');
  });
});
