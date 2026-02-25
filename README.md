# ⚡ Eflo — Visual Workflow Engine

A visual workflow engine inspired by Node-RED and n8n. Design workflows with drag-and-drop, export/import as JSON, execute and view logs — all from the browser.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  React Frontend (Bun + Vite + React Flow)            │
│  ┌─────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │  Node   │ │  Canvas  │ │  Config / History  │    │
│  │ Palette │ │ (drag &  │ │     Panels         │    │
│  │         │ │  drop)   │ │                    │    │
│  └─────────┘ └──────────┘ └────────────────────┘    │
└──────────────────┬───────────────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼───────────────────────────────────┐
│  Go Backend (Chi Router)                             │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │ Workflow │ │  Execution   │ │   Task Engine   │  │
│  │   CRUD   │ │   Handler    │ │  (DAG Runner)   │  │
│  └──────────┘ └──────────────┘ └─────────────────┘  │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  MySQL 8  (workflows, executions, execution_logs)    │
└──────────────────────────────────────────────────────┘
```

## Node Types

| Node | Description |
|------|-------------|
| ▶ **Start** | Entry point of the workflow |
| ⏹ **End** | Exit point, finalises execution |
| 🌐 **HTTP Request** | Makes HTTP calls (GET/POST/PUT/DELETE) |
| ⏱ **Delay** | Waits for a specified duration |
| 🔀 **Condition** | Branches flow based on an expression (true/false) |
| 📝 **Log** | Logs a message |
| ⚙ **Transform** | Evaluates an expression to transform data |

## Prerequisites

- **Go** 1.21+
- **Bun** (installed via `brew install oven-sh/bun/bun`)
- **MySQL 8** (or use Docker)
- **Docker & Docker Compose** (optional, for MySQL)

## Quick Start

### 1. Start MySQL

```bash
docker-compose up -d
```

This starts MySQL 8 on port 3306 with:
- **User**: `root`
- **Password**: `rootpass`
- **Database**: `eflo`

### 2. Start the Backend

```bash
# From project root
go run main.go
```

The backend starts on `http://localhost:8080`. Tables are auto-created on startup.

### 3. Start the Frontend

```bash
cd frontend
bun install    # first time only
bun dev
```

The frontend starts on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows` | List all workflows |
| `POST` | `/api/workflows` | Create a workflow |
| `GET` | `/api/workflows/:id` | Get a workflow |
| `PUT` | `/api/workflows/:id` | Update a workflow |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |
| `GET` | `/api/workflows/:id/export` | Export workflow as JSON |
| `POST` | `/api/workflows/import` | Import workflow from JSON |
| `POST` | `/api/workflows/:id/execute` | Execute a workflow |
| `GET` | `/api/workflows/:id/executions` | List executions for a workflow |
| `GET` | `/api/executions/:id` | Get execution details |
| `GET` | `/api/executions/:id/logs` | Get execution logs |

## Import / Export

### Export
Click **📤 Export** in the toolbar. Downloads a `.json` file with the workflow definition.

### Import
Click **📥 Import** in the toolbar. Select a `.json` file previously exported.

### JSON Format
```json
{
  "name": "My Workflow",
  "description": "Does something cool",
  "definition": {
    "nodes": [
      {
        "id": "node_1",
        "type": "start",
        "label": "Start",
        "positionX": 250,
        "positionY": 50,
        "properties": {}
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "node_2"
      }
    ]
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | `rootpass` | MySQL password |
| `DB_NAME` | `eflo` | MySQL database |
| `SERVER_PORT` | `8080` | Backend HTTP port |

## Project Structure

```
eflo/
├── main.go                          # Go entrypoint
├── docker-compose.yml               # MySQL container
├── backend/
│   ├── config/config.go             # Environment config
│   ├── db/
│   │   ├── mysql.go                 # DB connection
│   │   └── migrations.go            # Auto-create tables
│   ├── models/
│   │   ├── workflow.go              # Workflow + definition types
│   │   ├── execution.go             # Execution model
│   │   └── execution_log.go         # Execution log model
│   ├── repository/
│   │   ├── workflow_repo.go         # Workflow CRUD
│   │   ├── execution_repo.go        # Execution CRUD
│   │   └── execution_log_repo.go    # Log queries
│   ├── engine/
│   │   ├── engine.go                # DAG runner
│   │   ├── node.go                  # Node interface + registry
│   │   └── nodes/                   # Node type implementations
│   │       ├── start.go
│   │       ├── end.go
│   │       ├── http_request.go
│   │       ├── delay.go
│   │       ├── condition.go
│   │       ├── log.go
│   │       ├── transform.go
│   │       └── register.go
│   └── api/
│       ├── router.go                # Chi router + CORS
│       ├── workflow_handler.go      # Workflow API handlers
│       └── execution_handler.go     # Execution API handlers
└── frontend/                        # React + Bun + Vite
    ├── src/
    │   ├── App.tsx                  # Main layout
    │   ├── api/client.ts            # Axios API client
    │   ├── store/workflowStore.ts   # Zustand state
    │   ├── nodes/index.tsx          # Custom React Flow nodes
    │   └── components/
    │       ├── Canvas.tsx           # React Flow canvas
    │       ├── NodePalette.tsx      # Draggable node list
    │       ├── NodeConfigPanel.tsx  # Node property editor
    │       ├── Toolbar.tsx          # Save/Run/Import/Export
    │       └── ExecutionHistory.tsx # Execution logs viewer
    └── package.json
```

