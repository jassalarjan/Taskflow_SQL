# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Backend
- Start in development mode: `cd backend && npm run dev`
- Start in production mode: `cd backend && npm start`
- Seed default admin user: `cd backend && npm run seed:admin`
- Test email configuration: `cd backend && npm run test:email`
- Cleanup admin users: `cd backend && npm run cleanup:admins`
- Migrate workspaces: `cd backend && npm run migrate:workspaces`

### Frontend
- Start development server: `cd frontend && npm run dev`
- Build for production: `cd frontend && npm run build`
- Preview production build: `cd frontend && npm run preview`

## Architecture Overview

TaskFlow is an enterprise task management system with a decoupled MERN stack architecture (now migrating/using SQL components as indicated by repository name `Taskflow_SQL`).

### High-Level Structure
- `backend/`: Node.js/Express API serving as the core business logic and data layer.
- `frontend/`: React application built with Vite and TailwindCSS.

### Backend Architecture
- **Database**: Transitioning/Hybrid use of MongoDB (Mongoose) and MySQL (Sequelize).
- **Real-time**: Socket.IO for instant synchronization of tasks, users, and teams.
- **Authentication**: JWT-based with access and refresh tokens.
- **Authorization**: Role-Based Access Control (RBAC) with 6 roles: System Admin, Workspace Admin, Community Admin, HR, Team Lead, and Member.
- **Multi-tenancy**: Workspace-based isolation. Data is scoped by `Workspace` to ensure separation between CORE (enterprise) and COMMUNITY (free) tenants.
- **Email System**: A unified template engine using Handlebars and Brevo API for transactional emails.
- **Scheduling**: `node-cron` used for daily overdue reminders and weekly reports.
- **Audit Trail**: `ChangeLog` system tracking all significant modifications across the platform.

### Frontend Architecture
- **State Management**: React Context for Authentication and Theming.
- **Routing**: `react-router-dom` with `ProtectedRoute` wrappers for RBAC.
- **Data Visualization**: Recharts for advanced analytics.
- **PWA**: Integrated service workers via `vite-plugin-pwa` for offline support and push notifications.
- **UI/UX**: TailwindCSS for styling, Lucide React for icons, and Framer Motion for animations.

### Key Directories
- `backend/models/`: Database schemas and models.
- `backend/routes/`: API endpoint definitions.
- `backend/middleware/`: Auth, role, and workspace validation.
- `backend/utils/`: Shared logic (JWT, email, security).
- `backend/services/`: Business logic for complex operations (Brevo, HR actions).
- `frontend/src/pages/`: View components for different application sections.
- `frontend/src/components/`: Reusable UI elements.
- `frontend/src/context/`: Global state providers.
- `frontend/src/hooks/`: Custom React hooks for logic reuse.
