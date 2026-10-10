# IncidentQ Enterprise Reliability Operations Platform

IncidentQ is an enterprise incident management, operational telemetry, and automated root-cause investigation platform designed for high-availability engineering teams.

---

## Architecture Overview

```
+---------------------------------+       HTTP / JSON        +-----------------------------------+
|      IncidentQ Frontend         | -----------------------> |       IncidentQ Backend           |
|    (React + Vite + GSAP)        |     JWT Authentication   |     (Node.js / Express API)       |
|    Single Page Application      |                          |     Port 8080 / Production Host   |
+---------------------------------+                          +-----------------+-----------------+
                                                                               |
                                                                               v
                                                             +-----------------------------------+
                                                             |        MySQL 8.0 Cluster          |
                                                             |    incidentiq_db Persistence      |
                                                             +-----------------------------------+
```

---

## Repository Structure

```
IncidentQ/
├── frontend/             # Single Page Application (React, Vite, GSAP)
│   ├── src/              # Application source code
│   │   ├── App.jsx       # Operational cockpit & authentication
│   │   ├── dashboard.css # Enterprise theme & layout
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/              # Core API Services & Telemetry Engine
│   ├── server.js         # REST endpoints, auth, and telemetry engine
│   ├── package.json
│   └── pom.xml           # Spring Boot / Java reference specification
├── render.yaml           # Turnkey Render Blueprint specification
├── .gitignore
└── README.md
```

---

## Deploying to Render (render.com)

This repository includes a `render.yaml` Blueprint specification for one-click deployment on Render.

### Option A: Automatic Blueprint Deployment (Recommended)

1. Push this repository to your GitHub account (`https://github.com/pmb20/IncidentQ`).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect this GitHub repository.
5. Render will automatically detect `render.yaml` and configure:
   - **Backend Web Service** (`incidentq-backend`): Node.js service running `node server.js`
   - **Frontend Static Site** (`incidentq-frontend`): Vite build published to `dist`
6. Provide your MySQL database credentials under the Environment Variables section:
   - `MYSQL_HOST`
   - `MYSQL_PORT` (e.g. `3306`)
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
7. Click **Apply**. Both services will build and deploy automatically.

### Option B: Manual Service Configuration on Render

If configuring services individually:

#### 1. Backend Service
- **Type**: Web Service
- **Root Directory**: `backend`
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Health Check Path**: `/api/health/db`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `8080` (or leave default assigned by Render)
  - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`

#### 2. Frontend Service
- **Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rules**: Source `/*` -> Destination `/index.html`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-backend-service-url.onrender.com`

---

## Local Development

### 1. Database Setup (MySQL 8.0)
```sql
CREATE DATABASE IF NOT EXISTS incidentiq_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'incidentiq_user'@'localhost' IDENTIFIED BY 'YourStrongAppPassword_2026!';
GRANT ALL PRIVILEGES ON incidentiq_db.* TO 'incidentiq_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup
```bash
cd backend
npm install
node server.js
```
The server will start on `http://localhost:8080`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
The application cockpit will be accessible at `http://localhost:5173`.

---

## Default Corporate Profiles

| Name | Role | Email | Password |
|---|---|---|---|
| Manikanta | Incident Operations Commander | 23eg107b48@anurag.edu.in | password123 |
| Alex Chen | Lead Reliability Engineer | alex.chen@incidentq.com | password123 |
| Sara Connor | Site Reliability Engineer | sara.connor@incidentq.com | password123 |
| Elena Rostova | Principal Systems Architect | elena.rostova@incidentq.com | password123 |

---

## License
Proprietary - Enterprise Incident Management Platform.
