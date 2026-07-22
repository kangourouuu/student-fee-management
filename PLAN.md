# Project Plan: Student Fee Management System
## Step-by-Step Implementation Roadmap (PLAN.md)

This roadmap outlines the exact phases, milestones, and testing strategies required to build the Student Fee Management System.

---

## Phase 1: Database & Backend Initialization (Go)
*Goal: Initialize the repository, configure Neon PostgreSQL, scaffold the database with enums, and establish global response/logging middleware.*

1.  **Postgres Setup (Neon)**:
    *   Create a Neon serverless instance.
    *   Create a `.env` file in the project root to store environment variables (e.g., `DATABASE_URL` containing the Neon connection string).
    *   Execute the SQL schema defined in [AGENTS.md](file:///E:/student-management/AGENTS.md) under the `student_fee_core` schema.
2.  **Go Application scaffolding**:
    *   Initialize Go module `go mod init student-fee-management`.
    *   Install database driver: `go get github.com/jackc/pgx/v5`.
    *   Install Excel generation: `go get github.com/xuri/excelize/v2`.
    *   Install Router: `go get github.com/go-chi/chi/v5` (or lightweight alternative).
3.  **Database Connection Pool**:
    *   Write a database config module initializing `pgxpool.Pool` to handle concurrent connections efficiently.
4.  **Global Domain Enums & Go Type Definitions**:
    *   Define strongly typed Enums for domain concepts (e.g., Go custom `StudentStatus` type with constants `StatusEnrolled`, `StatusInactive`, `StatusGraduated`, `StatusSuspended`).
5.  **Global API Response Handler & Senior Structured Logging**:
    *   **Standardized REST Response Handler**: Formats all HTTP JSON responses into a clean unified payload structure:
        ```json
        {
          "status": "success | error",
          "response": { ... }
        }
        ```
    *   **Senior Structured Logger Middleware**: Intercepts requests and outputs JSON-formatted structured logs containing:
        *   `status`: HTTP status code or log severity level (`200`, `400`, `500` / `INFO`, `ERROR`)
        *   `relevant_component`: Target service/handler name (e.g., `auth_handler`, `student_service`, `billing_service`)
        *   `actual_debug_log`: Detailed log message, contextual data, or debug traceback.

---

## Phase 2: Core API Routes & ACID Billing Transactions (Go)
*Goal: Implement authentication, student endpoints, and the transactionally secure Excel billing pipeline.*

0.  **Database Schema Definition (with Postgres ENUMs)**:
    Ensure the following schema exists within `student_fee_core`:
    ```sql
    CREATE SCHEMA IF NOT EXISTS student_fee_core;

    -- Student Status ENUM
    DO $$ BEGIN
        CREATE TYPE student_fee_core.student_status AS ENUM ('enrolled', 'inactive', 'graduated', 'suspended');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Students Table
    CREATE TABLE student_fee_core.students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        status student_fee_core.student_status DEFAULT 'enrolled' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- AttendanceRecord Table
    CREATE TABLE student_fee_core.attendance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES student_fee_core.students(id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        is_present BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_student_date UNIQUE (student_id, record_date)
    );

    -- FeeStatement Table (Financial Audits)
    CREATE TABLE student_fee_core.fee_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES student_fee_core.students(id) ON DELETE CASCADE,
        billing_start_date DATE NOT NULL,
        billing_end_date DATE NOT NULL,
        fee_per_session NUMERIC(10, 2) NOT NULL CHECK (fee_per_session >= 0),
        total_days INT NOT NULL CHECK (total_days >= 0),
        total_fee NUMERIC(10, 2) NOT NULL CHECK (total_fee >= 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

1.  **Auth Layer**:
    *   Implement `/api/auth/login` and `/api/auth/logout`.
    *   Store static admin authentication credentials (`ADMIN_USERNAME` and `ADMIN_PASSWORD`) in `.env` for validation.
    *   Generate JWT session token upon successful validation and attach it strictly as an `HttpOnly`, `Secure`, `SameSite=Lax` Cookie.
    *   Wrap response using the global REST response handler (`status`, `response`).
2.  **Student Roster Routes**:
    *   `GET /api/students`: Fetch student rosters from `student_fee_core.students`.
    *   `POST /api/students`: Insert a new student record into the system using `StudentStatus` enum validation.
3.  **Attendance Tracker**:
    *   `GET /api/attendance?student_id={id}&month={date}`: Fetch student attendance matching the UI calendar month scope.
    *   `POST /api/attendance`: Toggle a student's attendance day. Create or delete matching entries in `student_fee_core.attendance_records`.
4.  **ACID Transactional Billing Service**:
    *   `POST /api/billing/export`:
        *   Start transactional execution: `tx, err := db.Begin(ctx)`.
        *   Retrieve active attendance days for the designated range.
        *   Compute total fee in-memory: `total_days * fee_per_session`.
        *   Audit log insertion: Insert a statement log entry into `student_fee_core.fee_statements`.
        *   Build Excel Document: Generate the sheet using `excelize/v2`.
        *   **Verify & Commit**: If Excel compilation succeeds, run `tx.Commit(ctx)`. If any stage fails, invoke the deferred `tx.Rollback(ctx)` to guarantee audit consistency. Return the spreadsheet byte stream to the client.

---

## Phase 3: Frontend Client Development (Angular 21)
*Goal: Build the Zoneless, Signal-powered Neumorphic client application.*

1.  **Angular Scaffold**:
    *   Initialize a new Angular 21 project with standalone components.
    *   Configure Zoneless Angular inside `app.config.ts`:
        ```ts
        import { provideExperimentalZonelessChangeDetection } from '@angular/core';
        export const appConfig: ApplicationConfig = {
          providers: [
            provideExperimentalZonelessChangeDetection(),
            // routes and client providers...
          ]
        };
        ```
2.  **State Management (Signals)**:
    *   Use Angular `Signal` wrappers to model dashboard search parameters, calendar state, active views, and calculation parameters.
3.  **Theme Elements (CSS/SCSS)**:
    *   Set up visual rules matching the `DESIGN.md` guidelines (3D neumorphic styling, drop/inset shadows, color schemes).
4.  **Views Implementation**:
    *   *Dashboard*: Student roster table + search bars.
    *   *Detail View*: Attendance grid showing large clickable calendar tiles with depressed active states.
    *   *Fee Modal*: Soft overlay rendering input variables (session fee) and dynamically updating total computed fees.

---

## Phase 4: Integration, Dockerization, & Deployment
*Goal: Build Docker containers, perform API binding tests, and deploy services.*

1.  **Docker Multi-Stage Build (`Dockerfile`)**:
    ```dockerfile
    # Build stage
    FROM golang:1.22-alpine AS builder
    WORKDIR /app
    COPY . .
    RUN CGO_ENABLED=0 GOOS=linux go build -o main .

    # Execution stage
    FROM alpine:latest
    RUN apk --no-cache add ca-certificates
    WORKDIR /root/
    COPY --from=builder /app/main .
    EXPOSE 8080
    CMD ["./main"]
    ```
2.  **Deployment Hosting**:
    *   **Backend API**: Link Go Git repo to Render Web Services (Docker environment, configure database connection string environment variables).
    *   **Frontend UI**: Deploy Angular project to Vercel (configure proxy path mappings to Render endpoint).
