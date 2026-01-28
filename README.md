# Campus Analytics (Project R)

**Name:** Jomar Thomas Almonte  
**Course:** SWENG 861 | Software Construction

## Description

This project is a centralized analytics dashboard designed to aggregate and visualize campus-wide trends for university administrators. It collects metrics from disparate domains (such as enrollment and facilities) to provide a unified view for data-driven decision-making. The system features Role-Based Access Control (RBAC) to ensure secure access for Deans and System Services.

## How to Run locally

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the backend server:
    ```bash
    npm start
    ```
3.  The server will run on `http://localhost:3000`.

## How to Test Authentication

1.  **Register a User**:

    ```bash
    curl -X POST http://localhost:3000/register \
      -H "Content-Type: application/json" \
      -d '{"username": "testuser", "password": "password123"}'
    ```

2.  **Login (Get Token)**:

    ```bash
    curl -X POST http://localhost:3000/login \
      -H "Content-Type: application/json" \
      -d '{"username": "testuser", "password": "password123"}'
    # Copy the "token" from response
    ```

3.  **Access Protected Route**:

    ```bash
    curl -H "Authorization: Bearer <YOUR_TOKEN>" http://localhost:3000/secure-data
    ```

4.  **Health Check**:
    ```bash
    curl http://localhost:3000/health
    # Expected output: {"status":"ok"}
    ```
5.  **Frontend**: Open `index.html` in your browser to view the landing page.

## Docker

Build and run the container:

```bash
docker build -t sweng861-week1 .
docker run -p 3000:3000 sweng861-week1
```

## Architecture

![Architecture Diagram](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/psu-edu/sweng861-crud-jzt5803/main/architecture.puml)
_(See [architecture.puml](architecture.puml) for source)_

## Tech Stack (Planned for Capstone)

- **Framework:** Next.js (JavaScript)
- **Database:** Turso (libSQL)
- **Auth:** NextAuth / JWT
