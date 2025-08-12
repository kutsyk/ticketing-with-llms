# Ticketing Platform - Web Frontend

This is the **frontend** for the Ticketing Platform, built with **Angular** and **Angular Material**.  
It provides a responsive and modern interface for end users, administrators, and ticket checkers.

---

## Features

- **User Portal**
  - Browse events and ticket types
  - Purchase tickets
  - Manage profile
  - View purchased tickets (with QR codes)
  - Download receipts

- **Admin Dashboard**
  - Manage users (CRUD)
  - Manage events (CRUD)
  - Manage ticket types (CRUD)
  - Manage tickets and payments
  - Export data

- **Ticket Checker Panel**
  - Scan ticket QR codes
  - Validate ticket status
  - Mark tickets as used
  - Issue tickets manually if needed

---

## Tech Stack

- **Angular 17+**
- **Angular Material**
- **RxJS**
- **TypeScript**
- **SCSS**
- **Chart.js** (for admin dashboards)
- **ngx-qr** (for QR generation and scanning)
- **REST API** (integrates with the backend API)

---

## Prerequisites

- **Node.js** 18+  
- **npm** 9+  
- Backend API running locally or remotely

---

## Installation

```bash
# Navigate to the web folder
cd web

# Install dependencies
npm install
````

---

## Development

```bash
# Start the development server
ng serve

# The app will be available at:
http://localhost:4200
```

---

## Building for Production

```bash
ng build --configuration production
```

The build output will be located in `dist/`.

---

## Environment Variables

Configuration for environments is in:

* `src/environments/environment.ts` (development)
* `src/environments/environment.prod.ts` (production)

Example:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api'
};
```

---

## Linting & Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

---

## License

This project is licensed under the MIT License.
