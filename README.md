# OrbitFlow

[](https://www.python.org/downloads/)
[](https://www.djangoproject.com/)
[](https://www.django-rest-framework.org/)

A Django REST Framework-based workflow automation engine that allows you to design, manage, and execute complex multi-step workflows.

Designed as a lightweight, code-first backend alternative to tools like n8n, OrbitFlow enables the automation of tasks by chaining multiple steps together. It features conditional execution, dynamic variable resolution, and webhook-based triggers, all backed by a robust execution tracking system.

## Features

  * **Multi-Step Pipelines:** Chain together multiple independent actions into a single automated workflow.
  * **Smart Branching:** Conditional step execution using `run_if` expressions to handle complex routing logic.
  * **Dynamic Context:** Built-in variable resolution utilizing context and trigger data across sequential steps.
  * **Event-Driven:** Trigger workflows manually via the API or automatically via incoming Webhooks.
  * **Observability:** Real-time execution tracking, comprehensive step-by-step logging, and detailed error capturing.
  * **Resilience:** Built-in retry mechanisms for failed workflow executions.

## Supported Integrations

The engine currently supports the following native step types:

  * **HTTP:** Make custom GET/POST requests to external APIs with configurable headers and payloads.
  * **DISCORD\_WEBHOOK:** Push automated messages and formatted alerts directly to Discord channels.
  * **SMTP\_EMAIL:** Dispatch emails with dynamic subjects and bodies via SMTP authentication.

-----

## Core Architecture

Understanding the data model is key to using OrbitFlow effectively:

1.  **Workflow:** The overarching container that defines a specific automation pipeline.
2.  **Step:** A single, isolated unit of work (e.g., fetching data, sending an email) within a Workflow.
3.  **Execution:** A single instance of a Workflow running, tracking its current state (Pending, Running, Success, Failed).
4.  **Step Log:** The immutable record of exactly what happened during a specific Step's execution, including I/O payloads and tracebacks.

-----

## Quick Start

### 1\. Local Setup

Clone the repository and set up your local environment:

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

*The API will be available at `http://localhost:8000/`*

### 2\. Create Your First Workflow

Create the workflow container:

```bash
POST /workflows/
{
  "title": "Daily Data Sync"
}
```

Add an HTTP step to fetch data:

```bash
POST /workflows/1/steps/
{
  "step_number": 1,
  "type": "HTTP",
  "config": {
    "method": "GET",
    "url": "https://api.example.com/data"
  }
}
```

Trigger the execution manually:

```bash
POST /workflows/1/execute/
{
  "trigger_reason": "Manual test run",
  "user_id": "123"
}
```

### 3\. Monitor Execution

Check the status of your workflow runs:

```bash
# Get all executions for Workflow #1 that successfully completed
GET /workflows/executions/?workflow=1&status=S&ordering=-started_at

# View the detailed logs for a specific execution
GET /workflows/executions/1/step-runs/
```

-----

## API Reference

### Workflows

  * `GET /workflows/` - List all workflows
  * `POST /workflows/` - Create a new workflow
  * `GET /workflows/<id>/` - Retrieve workflow details
  * `PUT /workflows/<id>/` - Update workflow
  * `DELETE /workflows/<id>/` - Delete workflow
  * `POST /workflows/<id>/steps/` - Append a step to a workflow
  * `POST /workflows/<id>/execute/` - Manually trigger an execution

### Executions & Observability

  * `GET /workflows/executions/` - List executions (Supports filters: `?workflow=ID`, `?status=P|R|F|S`)
  * `GET /workflows/executions/<id>/` - Retrieve execution status
  * `GET /workflows/executions/<id>/step-runs/` - Retrieve I/O logs for an execution
  * `POST /workflows/executions/<id>/retry/` - Retry a failed execution

### Webhooks

  * `POST /webhook/<workflow_id>/` - Trigger a workflow externally. The JSON payload is injected directly into the workflow's execution context.

-----

## Project Structure

```text
OrbitFlow/
├── orbitflow/                    # Django project config
├── workflows/                    # Main application
│   ├── models.py                 # Core Schema (Workflow, Step, Execution, Logs)
│   ├── views.py                  # API Endpoints
│   ├── services/                 # Core Engine Logic
│   │   ├── executor.py           # State machine & execution runner
│   │   ├── steps.py              # Step integrations (HTTP, Discord, etc.)
│   │   ├── registry.py           # Dynamic step registration
│   │   ├── condition_evaluator.py # run_if logic parser
│   │   └── variable_resolver.py  # Context injection
└── requirements.txt
```

-----
