# RAG Chatbot API

Production-ready FastAPI application for RAG (Retrieval-Augmented Generation) chatbot with document management, vector indexes, and AI agents.

## Features

- **Document Management**: Upload, list, and delete PDF documents
- **Vector Index Management**: Create, list, view, update, and delete Pinecone vector indexes
- **AI Agent Management**: Create, update, delete, and execute AI agents with custom system instructions
- **RAG Integration**: Automatically retrieve relevant context from vector stores when executing agents
- **API Versioning**: Clean API versioning with `/api/v1` prefix
- **Production-Ready**: Comprehensive logging, error handling, and modular architecture

## Project Structure

```
chatbot-be/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── documents.py    # Document management endpoints
│   │       ├── indexes.py      # Index management endpoints
│   │       └── agents.py       # Agent management endpoints
│   ├── core/
│   │   ├── config.py          # Configuration management
│   │   └── logger.py          # Logging setup
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   ├── services/
│   │   ├── document_service.py  # Document business logic
│   │   ├── index_service.py     # Index business logic
│   │   ├── agent_service.py     # Agent business logic
│   │   └── rag_service.py       # RAG execution logic
│   ├── utils/
│   │   ├── pdf_processor.py       # PDF processing utilities
│   │   ├── embedding_helper.py    # Embedding utilities
│   │   └── vector_store_helper.py # Pinecone utilities
│   └── main.py                # FastAPI application entry point
├── data/                      # PDF documents storage
├── .env                       # Environment variables
├── requirements.txt
└── pyproject.toml
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `chatbot-be` directory:

```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1

# Application
DATA_DIR=./data
LOG_LEVEL=INFO
```

### 3. Run the Application

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Documents

- `POST /api/v1/documents/upload` - Upload a PDF document
- `GET /api/v1/documents/` - List all documents
- `DELETE /api/v1/documents/{filename}` - Delete a document

### Indexes

- `GET /api/v1/indexes/` - List all indexes
- `GET /api/v1/indexes/{index_name}` - Get index details
- `POST /api/v1/indexes/` - Create a new index
- `DELETE /api/v1/indexes/{index_name}` - Delete an index
- `POST /api/v1/indexes/{index_name}/update` - Update index with specific documents
- `POST /api/v1/indexes/{index_name}/update-from-directory` - Update index with all documents from data directory

### Agents

- `POST /api/v1/agents/` - Create a new agent
- `GET /api/v1/agents/` - List all agents
- `GET /api/v1/agents/{agent_id}` - Get agent details
- `PUT /api/v1/agents/{agent_id}` - Update an agent
- `DELETE /api/v1/agents/{agent_id}` - Delete an agent
- `POST /api/v1/agents/execute` - Execute an agent with a query

## Usage Examples

### 1. Upload a Document

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@medical_book.pdf"
```

### 2. Create an Index

```bash
curl -X POST "http://localhost:8000/api/v1/indexes/" \
  -H "Content-Type: application/json" \
  -d '{
    "index_name": "medical-docs",
    "metric": "cosine"
  }'
```

### 3. Update Index with Documents

```bash
curl -X POST "http://localhost:8000/api/v1/indexes/medical-docs/update-from-directory"
```

### 4. Create an Agent

```bash
curl -X POST "http://localhost:8000/api/v1/agents/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical Assistant",
    "system_instruction": "You are a helpful medical assistant. Provide accurate information based on the context.",
    "index_name": "medical-docs",
    "temperature": 0.7
  }'
```

### 5. Execute an Agent

```bash
curl -X POST "http://localhost:8000/api/v1/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "your-agent-id",
    "query": "What is Gigantism?"
  }'
```

## Architecture

### Service Layer
- **DocumentService**: Handles file operations for PDF documents
- **IndexService**: Manages Pinecone vector indexes
- **AgentService**: Manages AI agent configurations
- **RAGService**: Executes agents with RAG capabilities

### Utilities
- **PDFProcessor**: Loads and splits PDF documents into chunks
- **EmbeddingHelper**: Manages HuggingFace embeddings (singleton pattern)
- **VectorStoreHelper**: Interacts with Pinecone for vector operations

### Design Principles
- **Separation of Concerns**: Clear boundaries between API, services, and utilities
- **Single Responsibility**: Each class/module handles one specific task
- **Production-Ready**: Comprehensive error handling, logging, and validation

## Development

### Adding a New API Version

1. Create a new directory: `app/api/v2/`
2. Add your endpoints
3. Include routers in `app/main.py`:

```python
from app.api.v2 import documents, indexes, agents

app.include_router(documents.router, prefix="/api/v2")
app.include_router(indexes.router, prefix="/api/v2")
app.include_router(agents.router, prefix="/api/v2")
```

### Logging

All services use centralized logging configured in `app/core/logger.py`. Set the log level in `.env`:

```env
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

## License

MIT
