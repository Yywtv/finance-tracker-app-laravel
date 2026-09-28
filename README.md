# Ledgerly

Ledgerly is a personal finance tracker for recording accounts, transactions, transfers, budgets, and recurring financial activity. It is implemented as two deliberately separate applications:

- a Laravel API and persistence layer
- a React client that communicates only over HTTP

The separation keeps backend concerns—authentication, authorization, validation, relationships, and business rules—on the server, while the frontend owns presentation, interaction, and client-side feedback.

## Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Frontend structure](#frontend-structure)
- [Development commands](#development-commands)
- [Testing](#testing)
- [Current limitations](#current-limitations)
- [Project rules](#project-rules)

## Architecture

```text
finance-tracker-app/
├── finance-tracker-api/        # Laravel 13 API and database layer
├── finance-tracker-frontend/   # Standalone React 19 client
└── README.md                   # This document
```

The two applications are not compiled together and do not share source code.

```text
Browser
  │
  ▼
React client ──────── HTTP / JSON ───────► Laravel API
                                             │
                                             ▼
                                        Eloquent / SQL
```

The API URL is supplied to the frontend through `VITE_API_URL`. No base URL is hard-coded throughout the React components.

## Features

The current application supports:

- Email/password registration and login
- Sanctum bearer-token authentication
- Current-user lookup and logout/token revocation
- Dashboard summary of:
  - total balance
  - current-month income
  - current-month expenses
  - recent transactions
- Account CRUD
- Category CRUD
- Transaction CRUD with pagination and filters
- Transfer CRUD with pagination and filters
- Budget CRUD
- Recurring transfer definitions
- Transaction attachment metadata CRUD
- Responsive desktop and mobile layouts
- Loading, empty, validation, server-error, and unauthorized states
- Destructive-action confirmation dialogs
- Integer-based financial amounts and currency-aware display where available

The frontend deliberately avoids inventing metrics that the API does not return. For example, it does not display category spending totals or budget remaining amounts until the backend exposes those values.

## Technology

### Backend

- PHP 8.3+
- Laravel 13
- Laravel Fortify for the existing web authentication flows
- Laravel Sanctum for API tokens
- Eloquent and Laravel database migrations
- Pest/PHPUnit for backend tests
- Laravel Pint and Larastan/PHPStan for code quality

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Lucide React icons
- Vitest
- React Testing Library
- ESLint with TypeScript and React Hooks rules

## Requirements

Install the following before running the project:

- PHP 8.3 or newer
- Composer
- Node.js 22 or newer
- npm
- A configured database supported by Laravel

The default `.env.example` uses PostgreSQL:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=finance_tracker_api
DB_USERNAME=root
DB_PASSWORD=
```

SQLite is also supported for lightweight local work and is used by the automated test suite.

## Local setup

The API and frontend run as separate processes.

### 1. Start the API

```bash
cd finance-tracker-api

composer install
cp .env.example .env
php artisan key:generate
```

Configure the database values in `.env`, then run the migrations:

```bash
php artisan migrate
```

Optionally load the sample finance data:

```bash
php artisan db:seed
```

Start Laravel's development server:

```bash
php artisan serve
```

The API will be available at:

```text
http://localhost:8000
```

The JSON API is rooted at:

```text
http://localhost:8000/api
```

### 2. Start the React client

In a second terminal:

```bash
cd finance-tracker-frontend
npm install
cp .env.example .env
npm run dev
```

The Vite development server runs at:

```text
http://localhost:3000
```

The client and API are intentionally served from different origins in development. The API's default CORS configuration allows the local frontend ports `3000` and `127.0.0.1:3000`.

## Configuration

### Frontend environment

Create `finance-tracker-frontend/.env` from `.env.example`:

```dotenv
VITE_API_URL=http://localhost:8000/api
```

`VITE_API_URL` must include the `/api` path. Vite embeds this value into the client bundle at build time, so production builds should use the production API URL.

### Backend environment

The important API variables are:

```dotenv
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=finance_tracker_api
DB_USERNAME=root
DB_PASSWORD=

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Set `CORS_ALLOWED_ORIGINS` to the exact frontend origin in other environments. Multiple origins are comma-separated.

The API uses bearer tokens rather than requiring the separate React client to share the Laravel web session. This keeps the client independent from the Inertia/Fortify browser flow.

## API overview

All routes below are prefixed with `/api`.

### Public authentication routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Create a user and return a Sanctum token |
| `POST` | `/api/login` | Authenticate credentials and return a Sanctum token |

### Authenticated routes

These routes use:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/user` | Return the authenticated user |
| `GET` | `/api/dashboard` | Return dashboard aggregates and recent transactions |
| `POST` | `/api/logout` | Revoke the current token and return `204` |

### Resource routes

The following resources expose standard `apiResource` CRUD operations:

| Resource | Endpoint |
| --- | --- |
| Accounts | `/api/accounts` |
| Categories | `/api/categories` |
| Transactions | `/api/transactions` |
| Transfers | `/api/transfers` |
| Budgets | `/api/budgets` |
| Recurring transfers | `/api/recurring-transfers` |
| Transaction attachments | `/api/transaction-attachments` |

### Supported filters

Transactions support:

```text
type
account_id
category_id
from
to
page
```

Example:

```text
GET /api/transactions?type=expense&account_id=1&from=2026-09-01&to=2026-09-30
```

Transfers support:

```text
from_account_id
to_account_id
from
to
page
```

Example:

```text
GET /api/transfers?from_account_id=1&to=2026-09-30
```

Transaction and transfer list endpoints paginate at 20 records per page.

## Data model

The finance domain is user-owned and enforced by the API controllers.

```text
User
 ├── hasMany Account
 ├── hasMany Category
 ├── hasMany Transaction
 ├── hasMany Transfer
 ├── hasMany Budget
 └── hasMany RecurringTransfer

Account
 ├── hasMany Transaction
 ├── hasMany outgoing/incoming Transfer
 └── hasMany outgoing/incoming RecurringTransfer

Category
 ├── hasMany Transaction
 └── hasMany Budget

Transaction
 └── hasMany TransactionAttachment
```

Important details:

- Accounts store an opening balance and an account currency.
- Transactions reference both an account and a category.
- Transfers and recurring transfers reference a source and destination account.
- Budgets reference a category and a period.
- Attachments belong to a transaction.
- User-owned records are checked by the API before read, update, or delete operations.
- Foreign keys use cascading deletes where defined by the migrations.

## Frontend structure

```text
finance-tracker-frontend/src/
├── auth/          Authentication context and protected-route tests
├── components/    Shared shell, forms, tables, dialogs, feedback, and UI
├── hooks/         API resource loading
├── lib/           API client, formatting, and constants
├── pages/         Route-level screens
├── test/          Vitest setup
├── types.ts       API and domain types
├── App.tsx        Client-side routes
└── styles.css     Responsive design system
```

The frontend uses a small centralized API layer in `src/lib/api.ts`. It attaches the stored bearer token, normalizes API errors, exposes validation errors to forms, and centralizes unauthorized handling.

The application shell is responsive:

- desktop uses a persistent sidebar
- narrow screens use a drawer and touch-friendly controls
- data tables switch to record-style mobile layouts
- forms collapse to one column where appropriate

## Development commands

### API

Run commands from `finance-tracker-api/`:

```bash
php artisan serve             # start the development API
php artisan route:list        # inspect routes
php artisan migrate           # apply migrations
php artisan db:seed           # load sample data
php artisan test              # run Pest/PHPUnit tests
vendor/bin/pint --test        # check PHP formatting
vendor/bin/phpstan analyse    # run static analysis
```

The Composer `setup` script is also available for the original Laravel/Inertia toolchain, but the standalone frontend is installed and run separately.

### Frontend

Run commands from `finance-tracker-frontend/`:

```bash
npm run dev                   # start Vite
npm run build                 # type-check and build production assets
npm run preview               # serve the production build locally
npm run typecheck             # TypeScript validation
npm run lint                  # ESLint
npm run test                  # Vitest test suite
npm run test:watch            # Vitest watch mode
```

## Testing

### Backend

Backend tests live in `finance-tracker-api/tests/` and use Pest with `RefreshDatabase` for feature tests.

The current suite covers:

- authentication and registration
- Sanctum token login/logout
- account, category, transaction, transfer, budget, recurring transfer, and attachment behavior
- ownership isolation between users
- validation and filtering
- dashboard calculations
- settings behavior

The suite currently reports:

```text
158 passed, 4 skipped
```

The four skipped tests are conditional two-factor-authentication tests. See [Current limitations](#current-limitations).

### Frontend

Frontend tests use Vitest, jsdom, and React Testing Library. API requests and resource hooks are mocked, so the tests do not require Laravel or a database.

The focused suite covers:

- login rendering and submission
- registration rendering, validation, and submission
- authentication state and protected-route behavior
- transaction form submission
- transaction filter UI
- account creation form submission

Run it with:

```bash
npm run test
```

## Current limitations

These are deliberate boundaries of the current API, not frontend omissions.

### Dashboard calculations

The dashboard total is currently calculated as:

```text
sum(account opening balances) + income transactions - expense transactions
```

The API does not convert between account currencies. Transfers are stored separately and are not applied to the dashboard total.

### Budgets

The API stores budget limits, periods, and date ranges. It does not currently return category spending totals or remaining budget amounts, so the frontend does not display those figures.

### Recurring transfers

Recurring transfers are definitions with a frequency and next occurrence date. The API does not include a scheduler that automatically creates transfer records.

### Attachments

The attachment API accepts metadata:

- transaction
- stored file path
- original filename
- MIME type
- file size

It does not upload or serve files. The frontend labels this explicitly as attachment metadata rather than pretending to provide file transfer.

### Two-factor authentication

Two-factor authentication is currently disabled in `config/fortify.php`. Four backend tests are feature-gated and therefore skipped.

The repository contains some 2FA scaffolding, but it is not complete:

- the users migration does not include Fortify's two-factor columns
- the test factory's `withTwoFactor()` state is empty
- the security controller does not expose 2FA props
- the existing security page has no 2FA controls

The recommended approach is to leave 2FA disabled until the database, server, and frontend flows are implemented as one coherent feature. Enabling only the Fortify flag would make the skipped tests fail rather than add working functionality.

## Project rules

- Keep `finance-tracker-api/` as the Laravel backend/API.
- Keep `finance-tracker-frontend/` as the standalone React client.
- Do not import Laravel PHP or backend source into the React application.
- Do not add frontend components or pages to the API project.
- Keep API communication in the frontend API layer rather than scattering `fetch` calls through components.
- Treat the backend as authoritative for validation, authorization, relationships, and business rules.
- Do not present derived or fabricated financial data as if the API provided it.
- Configure the API URL through `VITE_API_URL`.
- Configure allowed frontend origins through `CORS_ALLOWED_ORIGINS`.
