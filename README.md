# RAG Chatbot - Production Ready

A modern, full-stack RAG (Retrieval-Augmented Generation) chatbot system with document management, vector search, and customizable AI agents. Built with FastAPI backend and React TypeScript frontend.

## 🎯 Overview

RAG Chatbot is a comprehensive AI-powered system that enables you to:
- Upload and manage PDF documents
- Create vector indexes for semantic search
- Build custom AI agents with specific instructions
- Query documents intelligently using RAG technology
- Get contextually-aware responses with source citations

Perfect for building knowledge bases, document Q&A systems, research assistants, and specialized domain experts.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RAG Chatbot System                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   React Frontend     │         │   FastAPI Backend    │
│  (chatbot-ui)        │◄───────►│   (chatbot-be)       │
│                      │  HTTP   │                      │
│  • Agent Management  │  REST   │  • Document Service  │
│  • Document Upload   │  API    │  • Index Service     │
│  • Index Management  │         │  • Agent Service     │
│  • Chat Interface    │         │  • RAG Service       │
└──────────────────────┘         └──────────────────────┘
                                          │
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
           │  Azure OpenAI   │  │    Pinecone     │  │  HuggingFace    │
           │   (GPT-4.1)     │  │ (Vector Store)  │  │  (Embeddings)   │
           │                 │  │                 │  │                 │
           │ • Text Gen      │  │ • Vector Search │  │ • all-MiniLM-L6 │
           │ • Chat          │  │ • Index CRUD    │  │ • Sentence      │
           │ • RAG           │  │ • Similarity    │  │   Transformers  │
           └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### System Flow

1. **Document Upload**: PDFs uploaded via UI → Backend processes and stores
2. **Indexing**: Documents chunked → Embedded → Stored in Pinecone
3. **Agent Creation**: User defines agent with system instructions and index
4. **Query Execution**: User query → Vector search retrieves context → LLM generates response
5. **Response Delivery**: Answer + source documents + metrics returned to UI

---

## 🛠️ Tech Stack

### Frontend (`chatbot-ui/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.7.2 | Type safety |
| **Vite** | 7.3.0 | Build tool & dev server |
| **Tailwind CSS** | 4.0.4 | Styling |
| **React Router** | 7.1.1 | Client-side routing |
| **Zustand** | 5.0.3 | State management |
| **Axios** | 1.7.9 | HTTP client |
| **React Hook Form** | 7.54.2 | Form handling |
| **Zod** | 3.24.1 | Schema validation |

### Backend (`chatbot-be/`)
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.123.0 | Web framework |
| **Python** | 3.13 | Programming language |
| **Uvicorn** | 0.38.0 | ASGI server |
| **Pydantic** | 2.12.4 | Data validation |
| **LangChain** | 1.0.1 | RAG orchestration |
| **Pinecone** | - | Vector database |
| **Azure OpenAI** | - | LLM provider |
| **HuggingFace** | - | Embedding models |
| **PyPDF** | 6.1.3 | PDF processing |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.13+
- **Azure OpenAI** account with API key
- **Pinecone** account with API key

### 1. Clone Repository

```bash
git clone <repository-url>
cd RAG-Chatbot
```

### 2. Backend Setup

```bash
# Navigate to backend
cd chatbot-be

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys:
#   - AZURE_OPENAI_API_KEY
#   - AZURE_OPENAI_ENDPOINT
#   - AZURE_OPENAI_DEPLOYMENT_NAME
#   - PINECONE_API_KEY
#   - PINECONE_ENVIRONMENT

# Create data directory
mkdir -p data

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend
cd chatbot-ui

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env:
#   VITE_API_BASE_URL=http://localhost:8000/api/v1
#   VITE_MAX_FILE_SIZE=15728640

# Start frontend dev server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## 📖 Usage Workflow

### Step 1: Create a Vector Index
1. Navigate to **Indexes** page
2. Click **"Create Index"**
3. Enter index name (e.g., `medical-docs`)
4. Select distance metric (cosine recommended)

### Step 2: Upload Documents
1. Navigate to **Documents** page
2. Upload PDF files (max 15MB each)
3. Select documents and click **"Add to Index"**
4. Or use **"Update from Directory"** to add all documents

### Step 3: Create an AI Agent
1. Navigate to **Agents** page
2. Click **"Create Agent"**
3. Configure agent:
   - **Name**: Agent identifier
   - **System Instruction**: Agent behavior and constraints
   - **Index**: Select your vector index
   - **Temperature**: 0.0 (focused) to 2.0 (creative)
   - **Max Tokens**: Response length limit

### Step 4: Chat with Agent
1. Navigate to **Chat** page
2. Select your agent from dropdown
3. Type your question
4. View AI response with:
   - Retrieved context documents
   - Execution time
   - Source citations

---

## 🎨 Key Features

### Document Management
- ✅ Drag & drop PDF upload
- ✅ File validation (type, size)
- ✅ Document listing and deletion
- ✅ Automatic text extraction and chunking

### Vector Index Management
- ✅ Create indexes with custom metrics
- ✅ Update indexes with specific documents
- ✅ Bulk update from directory
- ✅ View index statistics and metrics
- ✅ Index deletion with confirmation

### AI Agent Management
- ✅ Create agents with custom instructions
- ✅ Configure temperature and token limits
- ✅ Link agents to vector indexes
- ✅ Update agent configurations
- ✅ Delete agents safely

### Chat Interface
- ✅ Real-time chat with AI agents
- ✅ Context-aware responses via RAG
- ✅ Source document citations
- ✅ Execution time metrics
- ✅ Chat history persistence (100 messages per agent)
- ✅ Copy to clipboard functionality
- ✅ Markdown rendering

### Security & Performance
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting (10 requests/minute)
- ✅ Safe localStorage with validation
- ✅ Error boundaries for graceful failures
- ✅ Code splitting and lazy loading
- ✅ Optimized bundle size (62% reduction)
- ✅ React.memo for performance

---

## 📊 API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Documents
- `POST /documents/upload` - Upload PDF
- `GET /documents/` - List all documents
- `DELETE /documents/{filename}` - Delete document

### Indexes
- `POST /indexes/` - Create index
- `GET /indexes/` - List all indexes
- `GET /indexes/{index_name}` - Get index details
- `DELETE /indexes/{index_name}` - Delete index
- `POST /indexes/{index_name}/update` - Update with documents
- `POST /indexes/{index_name}/update-from-directory` - Bulk update

### Agents
- `POST /agents/` - Create agent
- `GET /agents/` - List all agents
- `GET /agents/{agent_id}` - Get agent details
- `PUT /agents/{agent_id}` - Update agent
- `DELETE /agents/{agent_id}` - Delete agent
- `POST /agents/execute` - Execute agent with query

---

## 🔧 Configuration

### Backend Configuration (`.env`)

```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Pinecone
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=us-east-1

# Application
DATA_DIR=./data
CHUNK_SIZE=1000
CHUNK_OVERLAP=20
LOG_LEVEL=INFO
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Frontend Configuration (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_MAX_FILE_SIZE=15728640
```

---

## 📦 Project Structure

```
RAG-Chatbot/
├── chatbot-be/                 # Backend (FastAPI)
│   ├── app/
│   │   ├── api/v1/            # API endpoints
│   │   ├── core/              # Configuration & logging
│   │   ├── models/            # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utilities (PDF, embeddings, vectors)
│   │   └── main.py            # FastAPI app
│   ├── data/                  # Document storage
│   ├── .env                   # Environment config
│   ├── requirements.txt       # Python dependencies
│   └── README.md             # Backend documentation
│
├── chatbot-ui/                # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand state
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities (security, storage)
│   │   └── App.tsx           # Root component
│   ├── dist/                 # Production build
│   ├── .env                  # Environment config
│   ├── package.json          # Node dependencies
│   └── README.md            # Frontend documentation
│
└── README.md                 # This file
```

---

## 🧪 Development

### Backend Development

```bash
cd chatbot-be

# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# View API docs
open http://localhost:8000/docs

# View logs
tail -f logs/app.log
```

### Frontend Development

```bash
cd chatbot-ui

# Run dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 Production Deployment

### Backend Production

```bash
cd chatbot-be

# Update .env with production keys
# Set LOG_LEVEL=WARNING

# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Production

```bash
cd chatbot-ui

# Update .env.production with production API URL

# Build
npm run build

# Serve with static file server or deploy dist/ to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Nginx
```

### Docker Deployment

Backend Dockerfile:
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Frontend Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔒 Security Considerations

### Backend
- Environment variables for sensitive keys
- CORS configuration for production domains
- Input validation with Pydantic
- File type and size validation
- Comprehensive error handling

### Frontend
- XSS prevention with input sanitization
- Rate limiting (10 requests/minute)
- Secure UUID generation
- Safe localStorage with validation
- Error boundaries for crash recovery

---

## 📈 Performance

### Backend Optimizations
- Singleton pattern for embedding model (reduces memory)
- Async/await for concurrent requests
- Efficient document chunking
- Vector search caching

### Frontend Optimizations
- Code splitting by route (React.lazy)
- Manual chunk configuration
- React.memo on expensive components
- 62% bundle size reduction
- Lazy loading of all pages

**Build Results:**
- Main bundle: 59 KB gzipped
- React vendor: 32 KB gzipped
- UI vendor: 23 KB gzipped
- Total initial load: ~114 KB gzipped

---

## 🐛 Troubleshooting

### Backend Issues

**Azure OpenAI Connection Error**
```bash
# Verify endpoint and key
curl https://your-resource.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2024-10-01-preview \
  -H "api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

**Pinecone Index Not Found**
- List indexes: `curl http://localhost:8000/api/v1/indexes/`
- Verify index name format: lowercase, alphanumeric, hyphens only

### Frontend Issues

**API Connection Refused**
- Ensure backend is running on port 8000
- Check `VITE_API_BASE_URL` in `.env`
- Restart dev server after changing `.env`

**Build Errors**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📚 Documentation

- **Backend API**: See `chatbot-be/README.md` for detailed API documentation
- **Frontend**: See `chatbot-ui/README.md` for component documentation
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **API Redoc**: `http://localhost:8000/redoc`

---

## 🤝 Contributing

1. Follow PEP 8 for Python code
2. Follow TypeScript strict mode guidelines
3. Add tests for new features
4. Update documentation
5. Use conventional commit messages

---

## 📄 License

[Your License Here]

---

## 🆘 Support

For issues and questions:
- **GitHub Issues**: [Your Repo URL]
- **Documentation**: See backend and frontend README files
- **API Docs**: http://localhost:8000/docs

---

## 🙏 Acknowledgments

- **FastAPI** - High-performance web framework
- **React** - UI library
- **Azure OpenAI** - LLM capabilities
- **Pinecone** - Vector database
- **LangChain** - RAG orchestration
- **HuggingFace** - Embedding models
- All open-source contributors

---

**Version**: 1.0.0
**Last Updated**: 2025-12-22
**Status**: Production Ready ✅
