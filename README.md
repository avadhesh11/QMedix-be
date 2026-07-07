# QMedix-Backend

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)

[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?logo=redis)](https://redis.io/)
[![Realtime](https://img.shields.io/badge/Realtime-QueueSync-orange)](#)
[![REST API](https://img.shields.io/badge/API-REST-green)](#)

The backbone of QMedix, this server handles complex scheduling logic, state-machine transitions for appointments, and optimized data retrieval via multi-layer caching.

---

##  Technical Optimizations

- **State-Machine Lifecycle:** Enforces strict transitions: `booked` → `waiting` → `in_progress` → `completed`.
- **Strategic Caching:** Utilizes **Redis** for read-heavy resources (Doctor/Hospital profiles) while maintaining the dynamic queue in PostgreSQL for absolute data consistency.
- **Real-time Synchronization:** Built-in support for Supabase Realtime to broadcast queue changes instantly.
- **Security:** JWT-based authentication via Supabase Auth with custom `roleMiddleware` for RBAC.

---

##  Tech Stack

- **Runtime:** Node.js with Express 5.x.
- **Database:** PostgreSQL (via Supabase).
- **Caching:** Redis for high-speed API responses.
- **Testing:** Jest and Supertest for API endpoint validation.
- **DevOps:** Nodemon for development and Dotenv for environment management.

---

##  API Structure

- `src/routes/auth.js`: Handles session verification and user roles.
- `src/routes/doctor.js`: Availability management and queue controls.
- `src/routes/patient.js`: Appointment booking and history retrieval.
- `src/routes/staff.js`: Walk-in registrations and token generation

---

## Collaborators
- [Tripti Gupta](https://github.com/Tripti213)
- [Avadhesh Nagar](https://github.com/avadhesh11)
- [Dev Joshi](https://github.com/devj-arch)
- [Tarun Jain](https://github.com/tarundeepakjain)
