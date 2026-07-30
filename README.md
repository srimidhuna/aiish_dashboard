# AIISH Dashboard

A comprehensive dashboard application for AIISH.

## Project Structure

This repository contains both the frontend and backend of the AIISH Dashboard application, organized into a monorepo structure.

- `/frontend` - A React application built with Vite, TypeScript, and TailwindCSS.
- `/backend` - A Node.js application built with NestJS and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn
- Docker (optional, for containerized deployments)

### Running Locally

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Environment Variables

Both the frontend and backend require environment variables to run. Please refer to `.env.example` in their respective directories for the required configuration keys.

## Deployment

A `docker-compose.yml` file is provided at the root of the project to facilitate running both services using Docker.

```bash
docker-compose up -d
```