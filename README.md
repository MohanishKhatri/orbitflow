
-----

# OrbitFlow

   

OrbitFlow is a Django REST Framework-based workflow automation engine designed to manage and execute multi-step logic pipelines. It utilizes a distributed task queue (Celery + Redis) to handle I/O-bound operations asynchronously, ensuring non-blocking API performance.

## Features

  * **Asynchronous Pipelines:** Offloads execution logic to background workers; triggers return a `202 Accepted` status immediately.
  * **Smart Branching:** Conditional step execution using `run_if` expressions to handle complex routing logic.
  * **Dynamic Context:** Built-in variable resolution engine that injects state and trigger data across sequential steps.
  * **Observability:** Real-time execution tracking with immutable step-level logs and error tracebacks.
  * **OpenAPI Documentation:** Integrated Swagger UI for interactive endpoint testing and schema discovery.

## Supported Integrations

The engine supports the following native step types:

  * **HTTP:** Custom GET/POST requests with configurable headers and payloads.
  * **DISCORD\_WEBHOOK:** Automated alerts and messages pushed to Discord channels.
  * **SMTP\_EMAIL:** Email dispatch via authenticated SMTP with dynamic subject/body resolution.

-----

## Core Architecture

1.  **Workflow:** The container defining the automation logic and step sequence.
2.  **Step:** An isolated unit of work (e.g., HTTP call, Email) within a Workflow.
3.  **Execution:** A specific runtime instance of a Workflow (Status: `Pending`, `Running`, `Success`, `Failed`).
4.  **Step Log:** Detailed record of a Step's execution, including input/output payloads and failure logs.

-----

## Quick Start

### 1\. Infrastructure Setup

OrbitFlow requires a Redis broker for task management.

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 2\. Local Environment Setup

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies and migrate
pip install -r requirements.txt
python manage.py migrate
```

### 3\. Execution

The system requires both the API server and the background worker to run simultaneously:

**Terminal 1 (API Server):**

```bash
python manage.py runserver
```

**Terminal 2 (Celery Worker):**

```bash
celery -A orbitflow worker --loglevel=info
```

-----

## API Reference

### Documentation

  * `GET /api/docs/` - Interactive Swagger UI portal.
  * `GET /api/schema/` - Raw OpenAPI 3.0 JSON schema.

### Workflows

  * `GET /api/workflows/` - List all workflows.
  * `POST /api/workflows/` - Create a new workflow.
  * `POST /api/workflows/<id>/steps/` - Append a new step to a workflow.

### Executions & Webhooks

  * `POST /api/webhook/<workflow_id>/` - Trigger a workflow asynchronously via external webhook.
  * `GET /api/workflows/executions/` - List executions (Filters: `?workflow=ID`, `?status=F`).
  * `POST /api/workflows/executions/<id>/retry/` - Re-queue a failed execution.
  * `GET /api/workflows/executions/<id>/step-runs/` - Retrieve I/O logs for an execution.

-----

## Project Structure

```text
OrbitFlow/
├── orbitflow/                    # Project Configuration
│   ├── celery.py                 # Celery app initialization
│   ├── settings.py               # Django & Redis/Celery config
│   └── urls.py                   # Root URL routing (inc. Swagger)
├── workflows/                    # Main Application
│   ├── tasks.py                  # Celery background tasks
│   ├── services/                 # Logic Engine
│   │   ├── executor.py           # State machine & execution logic
│   │   ├── steps.py              # Runner implementations
│   │   ├── variable_resolver.py  # Context injection logic
│   │   └── condition_evaluator.py # run_if logic parser
│   ├── models.py                 # Core Schema
│   ├── views.py                  # API Endpoints
│   └── serializers.py            # Data validation/serialization
└── docker-compose.yml            # Local infrastructure orchestration
```

-----

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
    "run_if": "steps.1.status_code == 200",
    "subject": "Sync Success"
  }
}
```

-----
