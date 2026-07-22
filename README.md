# Student Fee Management System

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Angular](https://img.shields.io/badge/Angular-21%20Zoneless-DD0031?style=flat&logo=angular)](https://angular.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2F%20Neon-4169E1?style=flat&logo=postgresql)](https://neon.tech)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, full-stack **Student Fee Management & Attendance Tracking System** built with **Go Clean Architecture** on the backend and **Zoneless Angular 21 with Signals** on the frontend, styled with a tactile 3D Neumorphic & Claymorphic design system.

---

## 🌟 Key Features

- **Clean Architecture (Go 1.24)**: Decoupled design following Domain, Usecase, Repository (PostgreSQL), and Delivery (HTTP) layers.
- **AES-256-GCM Encryption**: PII student contact information (phone numbers) is encrypted at rest using AES-256-GCM prior to database persistence.
- **Sanitized DTO Payloads**: API endpoints return `StudentDTO` objects with masked PII phone numbers (`+1 555-***192`) to prevent data leakage.
- **Zoneless Angular 21 Client**: Powered by Angular `Signal` wrappers and reactive computation models (`computed()`).
- **ACID Transactional Billing Service**: Performs in-memory fee calculation, statement audit logging in PostgreSQL (`student_fee_core.fee_statements`), and dynamic `.xlsx` spreadsheet compilation via `excelize/v2` with atomic rollback safety.
- **3D Neumorphic & Claymorphic UI**: Custom CSS design system adhering to clay volumes, soft inset/outset shadows, and glassmorphic panels.
- **Interactive Attendance Calendar**: Clickable calendar grid tiles for toggling student attendance days and visualizing monthly stats.
- **QR Payment Module**: Scan-to-pay banking QR code integrated into the fee export modal.
- **Standardized REST API Responses**: All endpoints return unified `{ "status": "success | error", "response": { ... } }` payloads.
- **Senior Structured Logging**: Built-in JSON logger emitting log entries with `status`, `relevant_component`, and `actual_debug_log`.
- **JWT Session Security**: Secure `HttpOnly`, `SameSite=Lax` cookie-based authentication.

---

## 📂 System Architecture & Directory Structure

```
E:/student-management/
├── cmd/
│   └── server/
│       └── main.go                 # Server entrypoint & dependency injection
├── internal/
│   ├── config/                     # Environment configuration loader
│   ├── domain/                     # Core domain entities, DTOs & repository/usecase contracts
│   │   ├── enums.go
│   │   └── models.go
│   ├── pkg/
│   │   └── crypto/                 # AES-256-GCM encryption/decryption & PII masking
│   ├── usecase/                    # Business logic application layer
│   │   ├── auth_usecase.go
│   │   ├── student_usecase.go
│   │   ├── attendance_usecase.go
│   │   └── billing_usecase.go
│   ├── repository/                 # Data access persistence layer
│   │   └── postgres/
│   │       ├── db.go               # pgxpool connection & schema migration
│   │       ├── student_repository.go
│   │       └── attendance_repository.go
│   └── delivery/                   # HTTP transport layer
│       └── http/
│           ├── handler/            # REST API handlers
│           ├── middleware/         # Auth & Senior Structured Logger middleware
│           └── response/           # Unified REST response wrapper
├── frontend/                       # Angular 21 Zoneless Signals Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/         # Login, Dashboard, StudentDetail, FeeModal
│   │   │   ├── guards/             # AuthGuard route protection
│   │   │   ├── services/           # AuthService, StudentService, AttendanceService, BillingService
│   │   │   └── models/             # Frontend model definitions
│   │   └── styles.css              # Neumorphic & Claymorphic CSS tokens
│   ├── angular.json
│   ├── package.json
│   ├── proxy.conf.json
│   └── tsconfig.json
├── .env.example
├── Dockerfile                      # Multi-stage production container build
└── README.md
```

---

## ⚡ Quick Start / Local Setup

### Prerequisites

* [Go 1.24+](https://golang.org/dl/)
* [Node.js 18+](https://nodejs.org/)
* [PostgreSQL 16](https://www.postgresql.org/) or [Neon Postgres](https://neon.tech/)

### 1. Backend Setup

1. Copy `.env.example` to `.env` and configure your database credentials:
   ```env
   PORT=8080
   DATABASE_URL=postgres://user:password@localhost:5432/student_fee_db?sslmode=disable
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   JWT_SECRET=super-secret-key-student-fee-management
   ENCRYPTION_KEY=32-byte-long-aes-256-gcm-secret-key-for-pii
   ```

2. Run the Go backend server:
   ```bash
   go run ./cmd/server
   ```

### 2. Frontend Setup

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. Open browser at `http://localhost:4200` (or `http://localhost:8080`).

---

## 📜 License

Distributed under the MIT License.
