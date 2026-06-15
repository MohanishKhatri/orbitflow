# OrbitFlow

OrbitFlow is a full-stack workflow automation engine. It allows users to design, build, and track multi-step logic pipelines through a modern React frontend dashboard backed by a Django REST Framework API and Celery+Redis task workers for asynchronous step executions.

---

## Features
*   **Asynchronous Processing:** Long-running pipeline steps are executed in background Celery workers.
*   **Vibrant React Dashboard:** Dark-themed dashboard built with Vite + React + TailwindCSS for managing workflows, adding steps, running triggers, and checking live execution logs.
*   **Step Logic & Context:** Resolve variables dynamically between steps using double-brace syntax `{{steps.1.response_body}}`.
*   **Conditional Execution:** Gate pipeline steps with conditionals (`run_if`).
*   **Immutable Execution Auditing:** Review live-polled detailed step logs, outputs, and errors for every single run.

---

## Supported Integrations
*   **HTTP Request:** Trigger arbitrary GET/POST APIs with custom payloads and headers.
*   **Discord Webhook:** Broadcast messages directly into Discord channels.
*   **SMTP Email:** Send emails to recipients via authenticated SMTP servers.

---

## File Structure

```text
OrbitFlow/
├── orbitflow/                    # Django Configuration
│   ├── celery.py                 # Celery app initialization
│   ├── settings.py               # Database, CORS, JWT and Celery config
│   └── urls.py                   # Routing (inc. Swagger & Webhooks)
├── workflows/                    # Django App (Logic Engine)
│   ├── tasks.py                  # Celery background tasks
│   ├── services/                 # Execution services
│   │   ├── executor.py           # Core execution loop
│   │   ├── steps.py              # HTTP, Discord, and SMTP execution logic
│   │   ├── variable_resolver.py  # Variable resolution engine
│   │   └── condition_evaluator.py # run_if evaluator (simpleeval)
│   ├── models.py                 # Workflow, Step, and Execution schemas
│   ├── views.py                  # API endpoints (Viewsets)
│   └── serializers.py            # Serializers & validation
├── frontend/                     # React Frontend Application (Vite + React)
│   ├── src/
│   │   ├── components/           # Shared components (Navbar, Loaders, ErrorBanner)
│   │   ├── context/              # Authentication context (AuthContext)
│   │   ├── pages/                # Views (WorkflowDashboard, StepBuilder, ExecutionsList, ExecutionTracker, LoginPage, SignupPage)
│   │   ├── api.js                # Axios configuration and JWT refreshing
│   │   └── App.jsx               # Routes and layouts
│   ├── .env                      # Local frontend configuration
│   └── package.json              # Frontend dependencies
├── db.sqlite3                    # Local development database
├── docker-compose.yml            # Redis docker configuration
└── requirements.txt              # Backend python dependencies
```

---

## Quick Start

### 1. Infrastructure Setup (Redis)
Start the Redis broker required by Celery:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Backend Setup
1.  Duplicate the `.env.example` file and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Install python dependencies and run database migrations:
    ```bash
    # Activate virtual environment
    source virtualenv/bin/activate

    # Install dependencies & migrate
    pip install -r requirements.txt
    python manage.py migrate
    ```

### 3. Frontend Setup
Install npm packages:
```bash
cd frontend
npm install
```

### 4. Running OrbitFlow
Open three terminal windows to run the stack:

*   **Terminal 1 (Backend API):**
    ```bash
    python manage.py runserver
    ```
*   **Terminal 2 (Celery Workers):**
    ```bash
    celery -A orbitflow worker --loglevel=info
    ```
*   **Terminal 3 (Vite Frontend):**
    ```bash
    cd frontend && npm run dev
    ```

---

## API Reference

### Documentation
*   `GET /api/docs/` — Swagger UI API portal.

### Workflows & Steps
*   `GET /api/workflows/` — List workflows.
*   `POST /api/workflows/` — Create a workflow.
*   `GET /api/workflows/<id>/` — Retrieve details of a specific workflow.
*   `PATCH /api/workflows/<id>/` — Update workflow (e.g. rename or toggle `is_active` status).
*   `DELETE /api/workflows/<id>/` — Delete a workflow.
*   `GET /api/workflows/<workflow_id>/steps/` — List steps for a workflow.
*   `POST /api/workflows/<workflow_id>/steps/` — Create a step.
*   `PATCH /api/workflows/steps/<id>/` — Edit a step.
*   `DELETE /api/workflows/steps/<id>/` — Delete a step.

### Webhook Triggers
*   `POST /api/webhook/<workflow_id>/?token=<webhook_token>` — Trigger a workflow run.

### Executions
*   `GET /api/workflows/executions/` — List execution runs.
*   `POST /api/workflows/executions/<id>/retry/` — Re-queue a failed execution.
*   `GET /api/workflows/executions/<id>/step-runs/` — Retrieve sequential logs for a run.

---

## Execution Logic

### Dynamic Variable Resolution
Steps support double-brace syntax to pull data from the execution context:
```json
{
  "type": "HTTP",
  "config": {
    "url": "https://api.example.com/sync",
    "payload": {
      "user": "{{trigger.user_id}}",
      "data": "{{steps.1.response_body}}"
    }
  }
}
```

### Conditional Logic
Use the `run_if` field to gate step execution based on previous results:
```json
{
  "type": "SMTP_EMAIL",
  "config": {
    "run_if": "{{steps.1.status_code}} == 200",
    "subject": "Sync Success"
  }
}
```
