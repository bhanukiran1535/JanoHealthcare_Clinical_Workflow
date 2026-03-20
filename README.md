# Dialysis Session Intake & Anomaly Dashboard

A full-stack application for dialysis centers to track patient treatment sessions and surface clinical anomalies in real-time. Built for nurses managing daily patient schedules across treatment units.

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Docker** (for MongoDB)

### Setup (clone → install → run in < 5 minutes)

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd dialysis-dashboard-monorepo
   npm run install:all
   ```

2. **Start Database**
   ```bash
   docker compose up -d
   ```

3. **Seed Demo Data**
   ```bash
   npm run server:seed
   ```

4. **Run Application**
   ```bash
   npm run dev:all
   ```

   This starts both the backend server and frontend dev server concurrently.
   Open **http://localhost:5173** to view the dashboard.

## 📜 Available Scripts

- `npm run install:all` - Install all dependencies (same as `npm install`)
- `npm run dev:all` - Start both frontend and backend servers concurrently
- `npm run dev` - Start only the frontend dev server
- `npm run server:dev` - Start only the backend server
- `npm run server:seed` - Seed the database with demo data
- `npm run build` - Build the frontend for production
- `npm run test` - Run tests for both frontend and backend

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  React Query → api/client.ts → /api/* (Vite proxy)      │
│  Components: Dashboard → ScheduleTable, Modals           │
│  Mock data fallback for standalone demo                  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP (JSON)
┌────────────────────────▼─────────────────────────────────┐
│                Express API (TypeScript)                   │
│  Routes: /schedule, /sessions, /patients                 │
│  Middleware: Zod validation, error handler, helmet        │
│  Services: anomalyDetector (pure function, env-config)   │
└────────────────────────┬─────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼─────────────────────────────────┐
│                    MongoDB                                │
│  Collections: patients, sessions, schedules              │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions
- **Monorepo Structure**: Frontend, backend, and shared types in separate workspaces
- **Pure Function Anomaly Detection**: No side effects, easy to test, env-configurable thresholds
- **Separate Collections**: Patients, sessions, and schedules for scalability
- **Mock Data Fallback**: Frontend works standalone for demos

## 🩺 Clinical Assumptions & Trade-offs

All anomaly thresholds are **configurable via environment variables**:

| Anomaly | Default Threshold | Rationale |
|---------|------------------|-----------|
| **Excess IDWG** | > 5% dry weight | KDOQI guidelines for cardiovascular risk |
| **High post BP** | > 140 mmHg systolic | KDIGO guidelines for poor outcomes |
| **Abnormal duration** | < 180 min or > 300 min | Standard 4-hour target with safety margins |

### Trade-offs
- **Schedule is date-based**: Simplified from shift-based for this demo
- **No real-time updates**: Uses polling instead of WebSockets
- **Timezone handling**: Local dates stored as strings (production would use UTC)

## 📊 Dataset & Seeding

The seed script (`npm run server:seed`) creates:
- 5 sample patients with realistic demographics
- Daily schedule for "Center A"
- Mix of completed and in-progress sessions
- Intentional anomalies for testing (high BP, excess weight gain, abnormal duration)

Run `npm run server:seed` to populate the database with demo data.

## 🎯 Demo & Screenshots

### Working Demo
- **Dashboard**: Today's sessions with anomaly indicators
- **Filter Toggle**: Hide/show patients without anomalies
- **Session Management**: Start, complete, and edit notes modals
- **Patient Registry**: Search, filter, and view history
- **Schedule Management**: Select patients and save daily schedules

*Screenshots available in `docs/Images/`*

## 🔧 Known Limitations & Future Improvements

- **Authentication**: No auth implemented (assumes trusted internal use)
- **Pagination**: Schedule endpoint loads all patients (needs pagination for scale)
- **Real-time Updates**: Replace polling with WebSockets for instant alerts
- **Audit Trail**: Session edits should be logged with timestamps
- **Accessibility**: Modal focus trapping and keyboard navigation
- **Patient Registration UI**: Backend supports it, frontend form needed

## 🤖 AI Usage

- **Used for**: Initial project scaffolding, boilerplate components, seed data generation, test cases
- **Manual changes**: Architectural decisions (pure function anomaly detection), MongoDB schema design, clinical threshold research, data flow implementation
- **Disagreement example**: AI suggested storing patient status as a mutable field on Patient documents. I disagreed, status should be derived from session data at query time to avoid synchronization issues. This keeps the source of truth in one place and prevents stale data problems.

---