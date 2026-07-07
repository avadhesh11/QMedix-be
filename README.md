# QMedix Backend Service

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?logo=redis)](https://redis.io/)
[![CI/CD](https://github.com/tarundeepakjain/QMedix-be/actions/workflows/ci.yml/badge.svg)](https://github.com/tarundeepakjain/QMedix-be/actions)

The backend service for QMedix, a high-performance outpatient department (OPD) queue management system. This server handles authentication, roles (Patient, Doctor, Hospital Admins, and Staff), appointment state machines, caching, and real-time broadcasts.

---

## 🚀 Key Features & Architectural Highlights

- **Queue State Machine:** Manages the lifecycle of patient queues: `booked` → `waiting` → `in_progress` → `completed` or `cancelled`.
- **Hybrid Data Tier:** Employs **Redis** as a cache for static metadata (doctor catalogs, hospital options) while persisting critical state transactions directly to **Supabase (PostgreSQL)**.
- **Real-Time Sync:** Leverages Supabase Realtime and web sockets to sync state modifications to frontend displays instantly.
- **Role-Based Access Control (RBAC):** Token-based authentication using HTTP-only cookies and custom verification middlewares for secure route separation.
- **Zero-Dependency Testing:** A comprehensive mock framework overrides network calls to Redis and Supabase, running the test suite in a completely isolated environment (no external DB dependencies required).

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js (v20+)
- **Web Framework:** Express 5.x
- **Databases:** PostgreSQL (Hosted on Supabase) + Redis (Cloud/Self-Hosted)
- **Session & Cookies:** Cookie Parser & JWT Session tokens
- **Testing Suite:** Jest & Supertest

---

## 💻 Local Setup & Installation

### 1. Prerequisites
- **Node.js** v20 or higher installed.
- **Redis Server** (Local instance or Cloud cluster).
- **Supabase Project** created with auth enabled and schema schemas matching patient, doctor, hospital, and staff tables.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/tarundeepakjain/QMedix-be.git
cd QMedix-be
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root folder matching the following schema:
```ini
PORT=6232
FRONTEND_PORT=5173
SESSION_SECRET=your_jwt_cookie_secret_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_role_key
REDIS_URL=redis://username:password@redis-host:port
```

### 4. Running the Application
- **Development Mode (Auto-Reload):**
  ```bash
  npm start
  ```
- **Production Mode:**
  ```bash
  node server.js
  ```

---

## 🧪 Testing

The repository has a comprehensive test suite (44+ tests) using **Jest** and **Supertest** to cover signups, logins, appointments booking/cancellations, doctor availability toggling, and staff admin features.

All database and caching queries are redirected to localized Jest manual mocks (`src/utils/__mocks__/`), allowing tests to run instantly on any machine (and in the CI pipeline) without requiring live database credentials or connections.

**Run the tests:**
```bash
npm test
```

---

## 📄 API Documentation

An exhaustive API registry listing endpoints, request bodies, query params, cookies, and HTTP responses can be found at [docs/API_DOCUMENTATION.md](file:///Users/mac/Library/CloudStorage/OneDrive-Personal/Projects/QMedix-be/docs/API_DOCUMENTATION.md).

---

## 🚢 Deployment Guidelines

### 1. Supabase Postgres Migration
Ensure all tables, views, and policies are set up in the production database:
- Tables: `Patient`, `Doctor`, `Hospital`, `Staff`, `Appointment`, `Approval_Requests`, `Emergency_Requests`, `Daily_OPDs`
- Views: `patient_appointment_view`, `emergency_requests_view`, `today_appointments`

### 2. Environmental Security
- Configure `SESSION_SECRET` with a secure, random string (e.g. via `openssl rand -hex 32`).
- Update `FRONTEND_PORT` or allow list domains in standard CORS configurations inside `src/app.js` to prevent unauthorized cross-origin requests.
- Mark session cookie settings as `secure: true` in production environment (ensure HTTPS protocol is active).

### 3. Continuous Integration
This project runs tests on every push/PR via GitHub Actions. The workflow config is stored in [.github/workflows/ci.yml](file:///Users/mac/Library/CloudStorage/OneDrive-Personal/Projects/QMedix-be/.github/workflows/ci.yml).

---

## 👥 Collaborators
- [Tripti Gupta](https://github.com/Tripti213)
- [Avadhesh Nagar](https://github.com/avadhesh11)
- [Dev Joshi](https://github.com/devj-arch)
- [Tarun Jain](https://github.com/tarundeepakjain)
