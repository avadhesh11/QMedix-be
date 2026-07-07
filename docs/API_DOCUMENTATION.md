# QMedix Backend API Documentation

This document describes all available REST API endpoints in the QMedix Backend, detailing headers, request payloads, success/error responses, and authorization roles.

---

## 🔒 Authentication & Role Middleware

Most protected endpoints require an `access_token` cookie (JWT) issued during login.
The application defines four distinct user roles:
- **`patient`** (authorized for patient actions)
- **`doctor`** (authorized for doctor status and completion controls)
- **`hospital`** (authorized for admin features, hospital staff registration, and approval pipelines)
- **`hospital-staff`** (authorized for front desk operations, walk-in registrations, and queue management)

---

## 📑 Table of Contents
1. [Authentication Endpoints (`/auth`)](#1-authentication-endpoints-auth)
2. [Patient Endpoints (`/patient`)](#2-patient-endpoints-patient)
3. [Doctor Endpoints (`/doctor`)](#3-doctor-endpoints-doctor)
4. [Hospital Admin Endpoints (`/hospital`)](#4-hospital-admin-endpoints-hospital)
5. [Staff Endpoints (`/staff`)](#5-staff-endpoints-staff)
6. [Global Endpoints (`/global`)](#6-global-endpoints-global)

---

## 1. Authentication Endpoints (`/auth`)

### Sign Up Patient
- **Endpoint:** `POST /auth/signup/patient`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123",
    "address": "123 Main Street",
    "dob": "1990-05-15",
    "gender": "male"
  }
  ```
  *(Note: `dob` must be in YYYY-MM-DD format. `gender` must be male, female, or other.)*
- **Response (200 OK):**
  ```json
  {
    "message": "patient signup successful",
    "patient": {
      "session": { "access_token": "...", "refresh_token": "..." },
      "Patient": { "id": "...", "name": "John Doe", "email": "...", "phone": "...", "address": "...", "dob": "...", "gender": "..." }
    },
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Sign Up Doctor (Pending Approval)
- **Endpoint:** `POST /auth/signup/doctor`
- **Request Body:**
  ```json
  {
    "name": "Dr. Smith",
    "email": "dr.smith@example.com",
    "address": "Cardiology Clinic",
    "phone": "9876543211",
    "password": "SecurePassword123",
    "speciality": "Cardiology",
    "hospital_id": "hospital-uuid-here"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Doctor registration request send successfully.",
    "doctor": { "id": "...", "role": "doctor", "status": "PENDING", ... },
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Sign Up Hospital
- **Endpoint:** `POST /auth/signup/hospital`
- **Request Body:**
  ```json
  {
    "name": "City General Hospital",
    "email": "admin@cityhospital.com",
    "phone": "9876543212",
    "password": "SecurePassword123",
    "address": "Hospital Plaza 1"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "hospital signin succesfull",
    "hospital": { ... },
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Sign Up Staff (Pending Approval)
- **Endpoint:** `POST /auth/signup/hospital-staff`
- **Request Body:**
  ```json
  {
    "hospital_id": "hospital-uuid-here",
    "name": "Jane Staff",
    "email": "jane@cityhospital.com",
    "phone": "9876543213",
    "password": "SecurePassword123",
    "dept": "Outpatient"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Staff registration request send succesfully.",
    "staff": { ... },
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Login Patient
- **Endpoint:** `POST /auth/login/patient`
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "userId": "patient-uuid",
    "patient": { "id": "patient-uuid", "name": "John Doe", ... },
    "session": { ... },
    "role": "patient",
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Login Doctor
- **Endpoint:** `POST /auth/login/doctor`
- **Request Body:**
  ```json
  {
    "email": "dr.smith@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "userId": "doctor-uuid",
    "doctor": { "id": "doctor-uuid", ... },
    "session": { ... },
    "role": "doctor",
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Login Hospital Admin
- **Endpoint:** `POST /auth/login/hospital`
- **Request Body:**
  ```json
  {
    "email": "admin@cityhospital.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "userId": "hospital-uuid",
    "hospital": { ... },
    "session": { ... },
    "role": "hospital",
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Login Staff
- **Endpoint:** `POST /auth/login/hospital-staff`
- **Request Body:**
  ```json
  {
    "email": "jane@cityhospital.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "userId": "staff-uuid",
    "staff": { ... },
    "session": { ... },
    "role": "hospital-staff",
    "access_token": "...",
    "refresh_token": "..."
  }
  ```

### Approve Pending Request (Doctor/Staff)
- **Endpoint:** `POST /auth/approve/:role/:id`
- **Authentication:** Required (Hospital Admin only)
- **URL Parameters:**
  - `role`: Either `doctor` or `staff`
  - `id`: UUID of approval request
- **Response (200 OK):**
  ```json
  {
    "message": "Doctor Approved.",
    "details": { "id": "doctor-uuid", "name": "Dr. Smith", ... }
  }
  ```

### Reject Pending Request
- **Endpoint:** `POST /auth/reject/:id`
- **Authentication:** Required (Hospital Admin only)
- **URL Parameters:**
  - `id`: UUID of approval request
- **Response (200 OK):**
  ```json
  {
    "message": "Request Rejected Successfully."
  }
  ```

### Get Authenticated User Profile
- **Endpoint:** `GET /auth/me`
- **Authentication:** Required (All roles)
- **Response (200 OK):**
  ```json
  {
    "message": "user fetched",
    "user": {
      "id": "...",
      "name": "...",
      "role": "patient"
    }
  }
  ```

### Update User Profile
- **Endpoint:** `PUT /auth/update`
- **Authentication:** Required (All roles)
- **Request Body:**
  ```json
  {
    "name": "John Updated",
    "phone": "9999999999"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Profile updated"
  }
  ```

### Refresh Authentication Tokens
- **Endpoint:** `POST /auth/refresh`
- **Headers/Cookies:** Must contain `refresh_token` cookie
- **Response (200 OK):**
  ```json
  {
    "message": "Access token refreshed"
  }
  ```
  *(Sets new HTTP-only cookies `access_token` and `refresh_token`)*

### Logout User
- **Endpoint:** `POST /auth/logout`
- **Response (200 OK):**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
  *(Clears cookies)*

---

## 2. Patient Endpoints (`/patient`)

### Book Appointment
- **Endpoint:** `POST /patient/book-appointment`
- **Authentication:** Required (Patient only)
- **Request Body:**
  ```json
  {
    "pref_doctor": "doctor-uuid",
    "hospital_id": "hospital-uuid",
    "department": "Cardiology",
    "bookingDate": "2026-07-08",
    "timeSlot": "10:00 AM",
    "isEmergency": false
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Appointment booked successfully",
    "details": {
      "id": "appointment-uuid",
      "pref_doctor": "doctor-uuid",
      "assigned_doctor": "doctor-uuid",
      "hospital_id": "hospital-uuid",
      "booked_for": "2026-07-08T10:00:00.000Z",
      "status": "waiting"
    }
  }
  ```

### Cancel Appointment
- **Endpoint:** `DELETE /patient/cancel-appointment/:appId`
- **Authentication:** Required (Patient only)
- **URL Parameters:**
  - `appId`: UUID of appointment to delete
- **Response (200 OK):**
  ```json
  {
    "message": "Appointment deleted successfully.",
    "details": [{ "id": "appointment-uuid", ... }]
  }
  ```

### Update Appointment
- **Endpoint:** `POST /patient/update-appointment/:appId`
- **Authentication:** Required (Patient only)
- **URL Parameters:**
  - `appId`: UUID of old appointment
- **Request Body:** Same as Book Appointment body.
- **Response (201 Created):**
  ```json
  {
    "message": "Appointment Updated Successfully.",
    "details": { "id": "new-appointment-uuid", ... }
  }
  ```

### Get My Appointments
- **Endpoint:** `GET /patient/get-appointments`
- **Authentication:** Required (Patient only)
- **Response (200 OK):**
  ```json
  {
    "message": "Appointments fetched successfully.",
    "data": [
      { "id": "appointment-uuid", "doctor_name": "...", "status": "waiting", ... }
    ]
  }
  ```

### Get Batch Patient Details
- **Endpoint:** `POST /patient/batch-details`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "ids": ["patient-uuid-1", "patient-uuid-2"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "patients": [
      { "id": "...", "name": "John Doe", "age": 36, "dob": "...", "gender": "Male", "phone": "..." }
    ]
  }
  ```

---

## 3. Doctor Endpoints (`/doctor`)

### Get All Doctors for Hospital
- **Endpoint:** `GET /doctor/all/:hospitalId`
- **Authentication:** None (Used by patients to browse)
- **URL Parameters:**
  - `hospitalId`: UUID of hospital
- **Response (200 OK):**
  ```json
  {
    "message": "Doctors fetched for hospital",
    "doctors": [
      { "id": "doctor-uuid", "name": "Dr. Smith", "speciality": "Cardiology", "isAvailable": true }
    ]
  }
  ```

### Mark Appointment as Completed
- **Endpoint:** `POST /doctor/mark-complete`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "appointmentId": "appointment-uuid",
    "remarks": "Patient had mild chest pain. Prescribed medication.",
    "started_at": "2026-07-07T10:00:00.000Z",
    "completed_at": "2026-07-07T10:15:00.000Z"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Appointment marked as completed",
    "data": { "id": "appointment-uuid", "status": "completed", ... }
  }
  ```

### Toggle Availability Status
- **Endpoint:** `POST /doctor/toggle-availability`
- **Authentication:** Required (Doctor only)
- **Response (200 OK):**
  ```json
  {
    "message": "Doctor Availability toggled."
  }
  ```

---

## 4. Hospital Admin Endpoints (`/hospital`)

### Get All Hospitals
- **Endpoint:** `GET /hospital/all`
- **Authentication:** None
- **Response (200 OK):**
  ```json
  {
    "message": "All hospitals fetched",
    "hospitals": [
      { "id": "hospital-uuid", "name": "City Hospital", "address": "..." }
    ]
  }
  ```

### Get Pending Sign-up Requests
- **Endpoint:** `GET /hospital/approvals`
- **Authentication:** Required (Hospital Admin only)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      { "id": "req-uuid", "role": "doctor", "name": "...", "status": "PENDING" }
    ]
  }
  ```

### Get All Staff and Doctor Details
- **Endpoint:** `GET /hospital/get-all-staff`
- **Authentication:** Required (Hospital Admin only)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      { "id": "staff-uuid", "name": "Jane Staff", "role": "staff" },
      { "id": "doctor-uuid", "name": "Dr. Smith", "role": "doctor" }
    ]
  }
  ```

### Save OPD Statistics
- **Endpoint:** `POST /hospital/save-opd`
- **Authentication:** Required (Hospital Admin only)
- **Request Body:**
  ```json
  {
    "date": "2026-07-07",
    "total_patients": 100,
    "emergency_patients": 5,
    "completed_appointments": 80
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "OPD Saved Successfully."
  }
  ```

### Get OPD Dashboard Analytics
- **Endpoint:** `GET /hospital/dashboard/opd`
- **Authentication:** Required (Hospital Admin only)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      { "id": "...", "date": "2026-07-07", "total_patients": 100, ... }
    ]
  }
  ```

---

## 5. Staff Endpoints (`/staff`)

### Staff Cancel Appointment
- **Endpoint:** `DELETE /staff/cancel-appointment/:appId`
- **Authentication:** Required (Staff only)
- **URL Parameters:**
  - `appId`: UUID of appointment
- **Response (200 OK):**
  ```json
  {
    "message": "Appointment deleted successfully.",
    "details": [...]
  }
  ```

### Toggle Emergency Status for Appointment
- **Endpoint:** `POST /staff/toggle-emergency/:appId`
- **Authentication:** Required (Staff only)
- **URL Parameters:**
  - `appId`: UUID of appointment
- **Response (201 Created):**
  ```json
  {
    "message": "Appointment Emergency status toggled successfully."
  }
  ```

### Approve Emergency Request
- **Endpoint:** `POST /staff/approve-emergency/:appId`
- **Authentication:** Required (Staff only)
- **URL Parameters:**
  - `appId`: UUID of appointment
- **Response (201 Created):**
  ```json
  {
    "message": "Emergency request approved successfully."
  }
  ```

### Reject Emergency Request
- **Endpoint:** `POST /staff/reject-emergency/:appId`
- **Authentication:** Required (Staff only)
- **URL Parameters:**
  - `appId`: UUID of appointment
- **Response (201 Created):**
  ```json
  {
    "message": "Appointment Emergency Requests Rejected Successfully."
  }
  ```

### Get Hospital Emergency Requests
- **Endpoint:** `GET /staff/emergency-requests/:hId`
- **Authentication:** Required (Staff only)
- **URL Parameters:**
  - `hId`: UUID of hospital
- **Response (200 OK):**
  ```json
  {
    "data": [
      { "appointment_id": "...", "patient_name": "...", "status": "PENDING" }
    ]
  }
  ```

### Register Walk-in Patient & Book
- **Endpoint:** `POST /staff/register-walkin`
- **Authentication:** Required (Staff only)
- **Request Body:**
  ```json
  {
    "patient_name": "Walk-in Patient",
    "doctor_id": "doctor-uuid",
    "hospital_id": "hospital-uuid",
    "phone": "9999988888",
    "gender": "male",
    "dob": "1988-12-01",
    "address": "Walk-in Road 10",
    "isEmergency": false
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Walk-in registered successfully",
    "details": { "id": "new-appointment-uuid", "status": "waiting", ... }
  }
  ```

---

## 6. Global Endpoints (`/global`)

### Get Today's Appointments
- **Endpoint:** `GET /global/appointments/today`
- **Authentication:** Required (All roles)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      { "id": "...", "patient_name": "...", "doctor_name": "...", "status": "waiting" }
    ]
  }
  ```
