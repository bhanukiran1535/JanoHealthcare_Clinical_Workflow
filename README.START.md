# SWE Internship — Take Home Assignment (Initial Research README)

## Assignment
- Selected: Assignment 1 — Dialysis Session Intake & Anomaly Dashboard (Full‑Stack Workflow)
- Stack: TypeScript (Express) + React + MongoDB
- Expected window: 6–10 hours

## Context
I’m documenting assumptions, project shape, and next steps before implementing code. This file is a “just started” commit-ready README for early progress and risk scoping.

## What’s done in this initial work
- Reviewed full assignment prompt end-to-end.
- Noted ambiguities and where judgment is needed.
- Created initial repository README.

## Ambiguities observed (for clarification / engineering tradeoffs)
- Clinically significant thresholds (IDWG, BP, duration) are not defined in task.
- “Today’s schedule” session status sources (manual schedule, existing collection, shift assignment) are unspecified.
- Expected auth model and read/write scopes are unspecified.

## Assumptions & Clinical trade-offs (initial research conclusions)
- Interdialytic weight gain (IDWG): `dryWeight * 0.05` (5%) is warning, `0.08` (8%) is critical.
- High post-dialysis systolic BP: 140 mmHg warning, 160 mmHg critical.
- Session duration: target 240 minutes; 30 minutes deviation in either direction is abnormal.
- Status flow: patient slot starts as `not_started`, becomes `in_progress` once `sessionStartedAt` is set, `completed` when `sessionEndedAt` exists.
- DB modeling: separate `patients` and `sessions` collections with `patientId` reference (scalable, avoids unbounded embedding).
- Anomaly rules will be configurable in code via a single normalization object; no hard-coded literals scattered in business logic.

## Minimum first end-to-end slice (plan)
1. Implement backend models + endpoints:
   - `POST /patients`
   - `POST /sessions`
   - `GET /schedule/today` (with anomaly flag)
2. Implement anomaly detection service and unit tests.
3. Seed script with sample patient + session data.
4. Frontend list schedule, add session, and anomaly badge filter.

## AI tools usage plan
- Manually verify clinical assumptions and replace any generic AI defaults.

