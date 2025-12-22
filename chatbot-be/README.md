# RAG Chatbot API - Production Ready

A modern, scalable FastAPI application for RAG (Retrieval-Augmented Generation) chatbot with document management, vector indexes, and AI agents powered by Azure OpenAI and Pinecone.

## 🚀 Features

### Core Functionality
- **Document Management**: Upload, list, and delete PDF documents with automatic processing
- **Vector Index Management**: Create, manage, and update Pinecone vector indexes
- **AI Agent Management**: Create, configure, and execute AI agents with custom system instructions
- **RAG Integration**: Automatic context retrieval from vector stores for enhanced responses
- **Chat Execution**: Execute agents with queries and get contextually-aware responses

### Technical Features
- ✅ FastAPI with async/await support
- ✅ Pydantic v2 for data validation
- ✅ Comprehensive error handling and logging
- ✅ CORS middleware for frontend integration
- ✅ API versioning with `/api/v1` prefix
- ✅ Modular service architecture
- ✅ Singleton pattern for resource management
- ✅ Interactive API documentation (Swagger & ReDoc)
- ✅ Health check endpoint
- ✅ Environment-based configuration

### AI & ML Stack
- **LLM**: Azure OpenAI (GPT-4.1)
- **Embeddings**: HuggingFace Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store**: Pinecone with configurable metrics (cosine, euclidean, dotproduct)
- **Document Processing**: LangChain with PyPDF
- **Chunking Strategy**: Configurable chunk size and overlap

---

## 📋 Prerequisites

- **Python**: 3.13 or higher
- **pip**: Latest version
- **Azure OpenAI**: API key and deployment
- **Pinecone**: API key and environment
- **Git**: For version control

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chatbot-be
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt

# Or using the package manager
pip install -e .
```

### 4. Configure Environment Variables

Create a `.env` file in the `chatbot-be` directory:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1

# Application Configuration
DATA_DIR=./data
CHUNK_SIZE=1000
CHUNK_OVERLAP=20
LOG_LEVEL=INFO

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### 5. Create Data Directory

```bash
mkdir -p data
```

---

## 🚦 Running the Application

### Development Mode

```bash
# Using uvicorn with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main

# Or using the module directly
python app/main.py
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# With access logs
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --access-log

# With specific log level
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
```

### Using Gunicorn (Production)

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Build and run:

```bash
# Build image
docker build -t rag-chatbot-api .

# Run container
docker run -p 8000:8000 --env-file .env rag-chatbot-api
```

---

## 📚 API Documentation

Once the application is running, access the interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📦 Project Structure

```
chatbot-be/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── documents.py       # Document management endpoints
│   │       ├── indexes.py         # Index management endpoints
│   │       └── agents.py          # Agent management endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # Configuration management
│   │   └── logger.py             # Logging setup
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_service.py   # Document business logic
│   │   ├── index_service.py      # Index business logic
│   │   ├── agent_service.py      # Agent business logic
│   │   └── rag_service.py        # RAG execution logic
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── pdf_processor.py      # PDF processing utilities
│   │   ├── embedding_helper.py   # Embedding utilities
│   │   └── vector_store_helper.py # Pinecone utilities
│   ├── __init__.py
│   └── main.py                   # FastAPI application entry point
├── data/                         # PDF documents storage
├── .env                          # Environment variables
├── .gitignore
├── requirements.txt              # Python dependencies
├── pyproject.toml               # Package configuration
├── agents.json                  # Agent persistence (local storage)
└── README.md
```

---

## 🎯 API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Documents (`/api/v1/documents`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a PDF document |
| GET | `/` | List all documents |
| DELETE | `/{filename}` | Delete a document |

### Indexes (`/api/v1/indexes`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all indexes |
| GET | `/{index_name}` | Get index details |
| POST | `/` | Create a new index |
| DELETE | `/{index_name}` | Delete an index |
| POST | `/{index_name}/update` | Update index with specific documents |
| POST | `/{index_name}/update-from-directory` | Update index with all documents |

### Agents (`/api/v1/agents`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a new agent |
| GET | `/` | List all agents |
| GET | `/{agent_id}` | Get agent details |
| PUT | `/{agent_id}` | Update an agent |
| DELETE | `/{agent_id}` | Delete an agent |
| POST | `/execute` | Execute an agent with a query |

---

## 💡 Usage Examples

### 1. Upload a Document

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@medical_book.pdf"
```

**Response:**
```json
{
  "filename": "medical_book.pdf",
  "file_path": "./data/medical_book.pdf",
  "size_bytes": 1024000,
  "uploaded_at": "2025-12-22T10:30:00"
}
```

### 2. Create a Vector Index

```bash
curl -X POST "http://localhost:8000/api/v1/indexes/" \
  -H "Content-Type: application/json" \
  -d '{
    "index_name": "medical-docs",
    "metric": "cosine"
  }'
```

**Response:**
```json
{
  "message": "Index 'medical-docs' created successfully",
  "success": true
}
```

### 3. Update Index with Documents

```bash
# Update with all documents from data directory
curl -X POST "http://localhost:8000/api/v1/indexes/medical-docs/update-from-directory"

# Or update with specific documents
curl -X POST "http://localhost:8000/api/v1/indexes/medical-docs/update" \
  -H "Content-Type: application/json" \
  -d '{
    "index_name": "medical-docs",
    "document_paths": ["./data/medical_book.pdf", "./data/anatomy.pdf"]
  }'
```

### 4. Create an AI Agent

```bash
curl -X POST "http://localhost:8000/api/v1/agents/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical Assistant",
    "system_instruction": "You are a specialized medical AI assistant. Answer questions based ONLY on the provided context documents.",
    "index_name": "medical-docs",
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

**Response:**
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Medical Assistant",
  "system_instruction": "You are a specialized medical AI assistant...",
  "index_name": "medical-docs",
  "temperature": 0.7,
  "max_tokens": 500,
  "created_at": "2025-12-22T10:35:00",
  "updated_at": "2025-12-22T10:35:00"
}
```

### 5. Execute an Agent

```bash
curl -X POST "http://localhost:8000/api/v1/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "550e8400-e29b-41d4-a716-446655440000",
    "query": "What is Gigantism?"
  }'
```

**Response:**
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "What is Gigantism?",
  "answer": "Based on the provided medical context, Gigantism is a condition...",
  "context_documents": [
    {
      "content": "Gigantism is characterized by...",
      "metadata": {
        "source": "medical_book.pdf",
        "page": 145
      },
      "score": 0.89
    }
  ],
  "execution_time_ms": 1245.5
}
```

---

## 🏗️ Architecture

### Service Layer Design

The application follows a **clean architecture** with clear separation of concerns:

#### 1. **API Layer** (`app/api/v1/`)
- Handles HTTP requests and responses
- Input validation with Pydantic
- Routes organization by domain (documents, indexes, agents)

#### 2. **Service Layer** (`app/services/`)

**DocumentService**
- File operations for PDF documents
- Upload, list, delete operations
- File system management

**IndexService**
- Pinecone index creation and management
- Index metadata and statistics
- Document vectorization and indexing

**AgentService**
- Agent CRUD operations
- Configuration management
- Persistence using JSON (easily replaceable with database)

**RAGService**
- Agent execution with RAG capabilities
- Context retrieval from vector stores
- LLM interaction with Azure OpenAI
- Response generation with context

#### 3. **Utility Layer** (`app/utils/`)

**PDFProcessor**
- PDF document loading
- Text extraction and chunking
- Configurable chunk size and overlap

**EmbeddingHelper** (Singleton)
- HuggingFace embeddings management
- Model caching for performance
- Batch embedding generation

**VectorStoreHelper**
- Pinecone operations (CRUD)
- Vector search and retrieval
- Index statistics and health checks

### Design Patterns

1. **Singleton Pattern**: EmbeddingHelper ensures single model instance
2. **Service Pattern**: Business logic separated from API routes
3. **Repository Pattern**: Data access abstracted in services
4. **Dependency Injection**: Settings injected via config
5. **Factory Pattern**: Settings factory with caching

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use `.env.example` as a template
- ✅ Rotate API keys regularly
- ✅ Use different keys for dev/staging/production

### CORS Configuration

For production, update `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "https://app.your-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### File Upload Security

Current implementation includes:
- File type validation (PDF only)
- File size limits (configured by upload client)
- Safe file naming
- Isolated storage directory

**Recommended Enhancements:**
```python
# Add max file size in bytes
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

# Validate file content, not just extension
import magic
mime = magic.from_buffer(file_content, mime=True)
if mime != 'application/pdf':
    raise ValueError("Invalid file type")
```

### API Rate Limiting

Add rate limiting middleware (production):

```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/agents/execute")
@limiter.limit("10/minute")
async def execute_agent(request: Request, ...):
    ...
```

### Input Validation

All inputs are validated using Pydantic schemas:
- Type checking
- Length constraints
- Pattern matching (for index names)
- Required field validation

---

## ⚡ Performance Optimization

### Embedding Caching

The `EmbeddingHelper` uses singleton pattern to cache the model:

```python
class EmbeddingHelper:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

### Async Operations

FastAPI runs with async/await for non-blocking I/O:
- Concurrent request handling
- Better resource utilization
- Improved throughput

### Connection Pooling

**Recommendation**: Add connection pooling for Pinecone:

```python
from pinecone import Pinecone

pc = Pinecone(
    api_key=settings.PINECONE_API_KEY,
    pool_threads=10  # Connection pool size
)
```

### Database Caching

**Current**: Agents stored in `agents.json`

**Recommendation**: Use Redis for caching and PostgreSQL for persistence:

```python
# Add to requirements.txt
redis==5.0.0
asyncpg==0.29.0
```

### Chunk Size Optimization

Default configuration:
```env
CHUNK_SIZE=1000
CHUNK_OVERLAP=20
```

Adjust based on your use case:
- **Smaller chunks (500-800)**: Better precision, more API calls
- **Larger chunks (1200-1500)**: Better context, fewer API calls

---

## 🧪 Testing

### Manual Testing Checklist

**Document Management:**
- [ ] Upload PDF file (< 15MB)
- [ ] Upload non-PDF file (should reject)
- [ ] List all documents
- [ ] Delete document
- [ ] Upload duplicate filename (should handle)

**Index Management:**
- [ ] Create index with valid name (lowercase, alphanumeric, hyphens)
- [ ] Create index with invalid name (should reject)
- [ ] List all indexes
- [ ] Get index details
- [ ] Update index with specific documents
- [ ] Update index from directory
- [ ] Delete index

**Agent Management:**
- [ ] Create agent with required fields
- [ ] Create agent with optional index
- [ ] List all agents
- [ ] Get agent by ID
- [ ] Update agent system instruction
- [ ] Update agent temperature
- [ ] Delete agent

**Agent Execution:**
- [ ] Execute agent without RAG (no index)
- [ ] Execute agent with RAG (with index)
- [ ] Verify context documents in response
- [ ] Check execution time metrics
- [ ] Test with empty query (should reject)
- [ ] Test with non-existent agent (should reject)

### Unit Testing

Create `tests/` directory:

```bash
pip install pytest pytest-asyncio httpx
```

Example test:

```python
# tests/test_documents.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_documents():
    response = client.get("/api/v1/documents/")
    assert response.status_code == 200
    assert "documents" in response.json()

def test_upload_document():
    with open("test.pdf", "rb") as f:
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", f, "application/pdf")}
        )
    assert response.status_code == 200
```

Run tests:
```bash
pytest tests/ -v
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Azure OpenAI Connection Error

**Problem**: `Error connecting to Azure OpenAI`

**Solution**:
1. Verify API key is correct in `.env`
2. Check endpoint URL format: `https://your-resource.openai.azure.com/`
3. Confirm deployment name matches your Azure resource
4. Verify API version is supported

```bash
# Test Azure OpenAI connection
curl https://your-resource.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2024-10-01-preview \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

#### 2. Pinecone Index Not Found

**Problem**: `Index 'xyz' not found`

**Solution**:
1. List all indexes: `curl http://localhost:8000/api/v1/indexes/`
2. Verify index name is lowercase with hyphens only
3. Check Pinecone API key and environment
4. Create index before updating with documents

#### 3. Embedding Model Download Issues

**Problem**: `Error loading embedding model`

**Solution**:
1. Check internet connection
2. Model downloads to `~/.cache/huggingface/`
3. Manually download model:
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
```

#### 4. File Upload Fails

**Problem**: `Error uploading file`

**Solution**:
1. Verify `data/` directory exists: `mkdir -p data`
2. Check file permissions: `chmod 755 data/`
3. Confirm file is valid PDF
4. Check file size (max 15MB recommended)

#### 5. Agent Execution Timeout

**Problem**: Agent execution takes too long or times out

**Solution**:
1. Reduce `CHUNK_SIZE` in `.env`
2. Limit `max_tokens` in agent configuration
3. Increase uvicorn timeout:
```bash
uvicorn app.main:app --timeout-keep-alive 300
```

---

## 📊 Production Deployment

### Environment Configuration

Create `.env.production`:

```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=production-key
AZURE_OPENAI_ENDPOINT=https://prod-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Pinecone
PINECONE_API_KEY=production-key
PINECONE_ENVIRONMENT=us-east-1

# Application
DATA_DIR=/var/app/data
LOG_LEVEL=WARNING

# Performance
CHUNK_SIZE=1000
CHUNK_OVERLAP=20
```

### Deployment Checklist

- [ ] Update CORS allowed origins to production domains
- [ ] Set `LOG_LEVEL=WARNING` or `ERROR` in production
- [ ] Use production API keys
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backup (if using DB)
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation (ELK, CloudWatch, etc.)
- [ ] Add rate limiting middleware
- [ ] Set up health check monitoring
- [ ] Configure auto-scaling (if on cloud)
- [ ] Set up CI/CD pipeline
- [ ] Document rollback procedures

### Systemd Service (Linux)

Create `/etc/systemd/system/rag-chatbot.service`:

```ini
[Unit]
Description=RAG Chatbot API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/app/chatbot-be
Environment="PATH=/var/app/chatbot-be/.venv/bin"
ExecStart=/var/app/chatbot-be/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable rag-chatbot
sudo systemctl start rag-chatbot
sudo systemctl status rag-chatbot
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

---

## 📈 Monitoring & Logging

### Application Logs

Logs are configured in `app/core/logger.py`:

```python
# View logs in real-time
tail -f logs/app.log

# Search for errors
grep "ERROR" logs/app.log

# View by date
grep "2025-12-22" logs/app.log
```

### Health Check Monitoring

Set up periodic health checks:

```bash
# Using cron
*/5 * * * * curl -f http://localhost:8000/health || alert_admin.sh
```

### Metrics Collection

**Recommendation**: Add Prometheus metrics:

```bash
pip install prometheus-fastapi-instrumentator
```

```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
```

### Error Tracking

**Recommendation**: Add Sentry integration:

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
    traces_sample_rate=1.0,
)
```

### Performance Monitoring

Monitor key metrics:
- Request latency (especially `/agents/execute`)
- Error rates
- Pinecone API response times
- Azure OpenAI API response times
- Document processing times
- Memory usage
- CPU usage

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_API_KEY` | Yes | - | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Yes | - | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Yes | - | Deployment name (e.g., gpt-4.1) |
| `AZURE_OPENAI_API_VERSION` | Yes | - | API version |
| `PINECONE_API_KEY` | Yes | - | Pinecone API key |
| `PINECONE_ENVIRONMENT` | Yes | - | Pinecone environment (e.g., us-east-1) |
| `DATA_DIR` | No | `./data` | Directory for document storage |
| `CHUNK_SIZE` | No | `1000` | Text chunk size for embeddings |
| `CHUNK_OVERLAP` | No | `20` | Overlap between chunks |
| `EMBEDDING_MODEL` | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model |
| `LOG_LEVEL` | No | `INFO` | Logging level |

### Agent Configuration

When creating agents, configure these parameters:

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `name` | string | - | Required | Agent name |
| `system_instruction` | string | - | Required | System prompt |
| `index_name` | string | - | `null` | Vector index (optional) |
| `temperature` | float | 0.0-2.0 | 0.7 | Response creativity |
| `max_tokens` | integer | 1-4096 | `null` | Max response length |

**Temperature Guide:**
- **0.0-0.3**: Focused, deterministic (good for factual Q&A)
- **0.4-0.7**: Balanced creativity and accuracy (recommended)
- **0.8-1.2**: Creative, varied responses
- **1.3-2.0**: Highly creative, experimental

---

## 🤝 Contributing

### Development Guidelines

1. Follow PEP 8 style guide
2. Use type hints for all functions
3. Add docstrings to all classes and functions
4. Write unit tests for new features
5. Update API documentation
6. Log important operations
7. Handle errors gracefully

### Code Style

```python
from typing import List, Optional

class MyService:
    """Service description.

    Attributes:
        config: Configuration object
    """

    def __init__(self, config: Settings):
        """Initialize service.

        Args:
            config: Settings instance
        """
        self.config = config
        self.logger = get_logger(__name__)

    async def process_data(
        self,
        data: List[str],
        options: Optional[dict] = None
    ) -> dict:
        """Process data with optional configuration.

        Args:
            data: List of items to process
            options: Optional processing options

        Returns:
            Processing results dictionary

        Raises:
            ValueError: If data is empty
        """
        if not data:
            raise ValueError("Data cannot be empty")

        self.logger.info(f"Processing {len(data)} items")
        # Implementation
        return {"status": "success"}
```

---

## 📄 License

[Your License Here]

---

## 🆘 Support

For issues and questions:
- **GitHub Issues**: [Your Repo URL]
- **Email**: [Your Support Email]
- **Documentation**: [Your Docs URL]

---

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- LangChain for RAG implementation utilities
- Azure OpenAI for LLM capabilities
- Pinecone for vector storage
- HuggingFace for embedding models
- All open-source contributors

---

**Version**: 1.0.0
**Last Updated**: 2025-12-22
**Status**: Production Ready ✅
