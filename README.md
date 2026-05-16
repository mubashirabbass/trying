# 🎓 Global College LMS (Edu-Sphere)

A premium, enterprise-grade Learning Management System built with React, Node.js, and PostgreSQL. Designed for high performance, visual excellence, and secure content delivery.

## 🚀 Key Features

- **Multi-Role Dashboards**: Specialized interfaces for Students, Teachers, and Administrators.
- **Secure Video Content**: YouTube protection with AES-256 encryption and signed access logs.
- **Advanced Course Builder**: Drag-and-drop curriculum management for educators.
- **Financial Module**: Multi-channel payment verification (EasyPaisa, JazzCash, Bank) with receipt auditing.
- **Identity Verification**: CNIC/Form-B document review system for academic integrity.
- **Real-time Analytics**: KPI dashboards for student performance and platform growth.
- **Automated Certificates**: QR-verified PDF certificate generation upon course completion.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, ShadCN UI, Lucide Icons.
- **Backend**: Node.js, Express, Zod (Validation), Orval (API Specs).
- **Database**: PostgreSQL with Drizzle ORM.
- **Reporting**: Puppeteer (PDF) and ExcelJS.
- **DevOps**: Docker, Docker Compose, PNPM Workspaces.

## 📦 Getting Started

### Prerequisites

- Node.js v24+
- PNPM v9+
- PostgreSQL v16+ (or Docker)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Edu-Sphere
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in the required variables:
   ```bash
   cp .env.example .env
   ```

4. **Database Setup**:
   ```bash
   pnpm run db:push
   ```

5. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

## 🐳 Docker Deployment

To run the entire stack (App + Database) using Docker:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:8080`.

## 🛡️ Security

- **JWT Authentication**: Secure session management with role-based access control (RBAC).
- **XSS Protection**: Automated input sanitization for all user-generated content.
- **Env Validation**: Critical configuration checks on startup.
- **Rate Limiting**: (Optional) Helmet.js implemented for header security.

## 📄 License

MIT
