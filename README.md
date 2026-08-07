# LearnSync

**Integrated Learning Management System for Global Online Education**

A scalable learning platform enabling students and instructors across different time zones to schedule customized learning sessions, securely process payments, and automatically create Zoom meetings.

![Node.js](https://img.shields.io/badge/Node.js-Express.js-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Auth](https://img.shields.io/badge/Auth-JWT-orange)
![Status](https://img.shields.io/badge/status-academic--project-lightgrey)

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Major Features](#major-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Software Architecture](#software-architecture)
- [Database Design](#database-design)
- [Authentication & Security](#authentication--security)
- [Software Engineering Concepts Applied](#software-engineering-concepts-applied)
- [Testing Strategy](#testing-strategy)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)
- [License](#license)

## Project Overview

LearnSync is a full-stack Learning Management System developed as part of a Software Engineering project. Unlike traditional LMS platforms centered around prerecorded content, LearnSync focuses on personalized one-on-one learning by allowing students to request custom study sessions from verified instructors.

The platform supports the complete session lifecycle — from instructor verification and session requests to payment processing (placeholder used, actual payment workflow not implemented yet) and automatic Zoom meeting generation — while maintaining security, scalability, and clean software architecture.

The system demonstrates practical application of software engineering principles including layered architecture, database normalization, RESTful API development, authentication, authorization, third-party API integration, transactional database operations, and systematic testing as well as extensive documentation in the form of Software Requirements Specification (SRS) and Software Design Specification (SDS).

## Problem Statement

Existing online tutoring platforms are often expensive, inflexible, or designed primarily around pre-recorded courses rather than personalized instruction. Students frequently struggle to connect with qualified instructors for customized learning sessions, while instructors lack an integrated platform that combines scheduling, payments, verification, and virtual classrooms.

LearnSync addresses these challenges by providing a centralized platform where verified instructors and students can securely connect, schedule customized sessions, complete payments, and conduct meetings through automatic Zoom integration.

## Solution

LearnSync provides an end-to-end solution that simplifies online tutoring by integrating user management, instructor verification, secure authentication, custom session scheduling, payment handling, timezone-aware booking, and automatic Zoom meeting creation into a single platform.

The platform supports three distinct user roles:

- **Student**
- **Instructor**
- **Administrator**

Each role has dedicated functionality while business rules are enforced through middleware and service-layer validation.

## Major Features

### User Management
- Student registration
- Instructor registration
- Administrator accounts
- Role-based authentication
- JWT authentication
- Cookie-based session management
- Secure password hashing

### Instructor Verification

Before becoming active, instructors upload:

- Certifications
- Demo teaching materials
- Subject expertise
- Education levels

Administrators review these documents before approving instructors, ensuring only verified instructors are visible to students.

### Session Management

Students can request personalized learning sessions by specifying:

- Topic
- Description
- Preferred date and time
- Duration

Instructors can:

- Accept requests
- Reject requests
- Set their own teaching fee

### Payment Workflow

Students complete payment only after instructor approval. The payment workflow:

- Creates payment records
- Tracks payment status
- Updates session state
- Ensures meetings cannot be generated without successful payment

### Zoom API Integration

Once payment succeeds:

- Zoom meetings are automatically created
- Meeting links are securely stored
- Links remain hidden until shortly before the session
- Availability conflicts are prevented through overlap checking
- Student and instructors are not required to create Zoom accounts

### Timezone Management

One of LearnSync's key features is global usability. The system stores all session times internally in UTC while automatically converting them into each user's local timezone, allowing students and instructors from different regions to schedule sessions without manual time calculations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| External APIs | Zoom Server-to-Server OAuth |
| Authentication | JWT, Cookies, bcrypt |
| Tooling | Git, GitHub, Nodemon |


## Software Architecture

LearnSync follows a layered architecture separating responsibilities into independent components:

```
Client (public/)
    │
Routes (routes/)
    │
Middlewares (middlewares/)
    │
Controllers (controllers/)
    │
Services (services/)
    │
Databases (databases/)
    │
PostgreSQL
```

External integrations such as the Zoom API and payment services are implemented as independent service modules, reducing coupling and improving maintainability.

This architecture improves:

- Scalability
- Modularity
- Maintainability
- Testability

## Database Design

The relational database was designed using:

- Entity Relationship Diagrams (ERDs)
- Third Normal Form (3NF)
- Foreign key constraints
- Transactional consistency

Core entities include:

- Users
- student_details
- instructor_details
- sessions
- payments
- meetings

## Authentication & Security

LearnSync incorporates several security mechanisms:

- JWT authentication
- Cookie-based sessions
- Role-based authorization
- Password hashing
- Protected REST endpoints
- Middleware validation
- File upload validation
- Business rule enforcement
- OWASP-aware secure practices

## Software Engineering Concepts Applied

- Layered Architecture
- Incremental Development Model
- Separation of Concerns
- RESTful API Design
- Database Normalization (3NF)
- ERD Modeling
- Relational Schema Design
- Authentication & Authorization
- Middleware-Based Request Validation
- Transactional Database Operations
- Third-Party API Integration
- Version Control using Git & GitHub
- Unit, Integration, and System Testing

## Testing Strategy

Testing was performed throughout development following an incremental approach.

**Unit Testing**
- Authentication
- Session management
- Payment services
- Zoom integration
- Database operations

**Integration Testing**
- Controller-Service communication
- Database integration
- Zoom API
- Payment workflow

**System Testing**

Complete end-to-end testing of:

- Instructor approval
- Student booking
- Payment
- Zoom meeting creation
- Dashboard functionality
- Role-based access

## Future Enhancements

- AI-powered instructor recommendations
- Mobile applications
- Payment gateways
- Analytics dashboard
- Multi-language support
- Calendar synchronization
- Email notifications

## Contributors

| Name | Contributions |
|---|---|
| Amna Ahmed | System Architecture, Zoom API Integration, Session Management, System Testing |
| Nida | ERD Design & Database Normalization |
| Zainab | Backend Architecture, Authentication & Authorization |
| Rida | Frontend Development & Database Contributions |

## License

This project was developed as part of an academic Software Engineering course and does not currently have an open-source license applied. Contact the contributors for reuse or collaboration inquiries.
