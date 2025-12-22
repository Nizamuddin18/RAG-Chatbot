# RAG Chatbot UI - Production Ready

A modern, secure, and performant React TypeScript frontend for the RAG (Retrieval-Augmented Generation) Chatbot system.

## 🚀 Features

### Core Functionality
- **Agent Management**: Create, edit, delete, and execute AI agents with custom configurations
- **Document Management**: Upload PDF files, manage documents, and add them to vector indexes
- **Index Management**: Create and manage Pinecone vector indexes for RAG
- **Chat Interface**: Interactive chat with AI agents powered by RAG and chat history persistence

### Security Features
- ✅ Input sanitization and XSS prevention
- ✅ Rate limiting (10 requests/minute)
- ✅ Secure localStorage with validation
- ✅ Agent ID validation
- ✅ Message size limits (max 10,000 characters)
- ✅ Secure UUID generation

### Performance Optimizations
- ✅ Code splitting and lazy loading
- ✅ React.memo on expensive components
- ✅ Optimized bundle size (62% reduction)
- ✅ Production build optimizations
- ✅ Error boundary for graceful error handling

### User Experience
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time loading states
- ✅ Toast notifications
- ✅ Chat history persistence (100 messages per agent)
- ✅ Context document display
- ✅ Execution time metrics

---

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Backend API**: Running on `http://localhost:8000` (or configured URL)

---

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd chatbot-ui

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your environment variables
nano .env
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_MAX_FILE_SIZE=15728640  # 15MB in bytes
```

---

## 🚦 Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 📦 Project Structure

```
chatbot-ui/
├── src/
│   ├── api/                    # API client and services
│   │   ├── client.ts
│   │   ├── agents.api.ts
│   │   ├── documents.api.ts
│   │   └── indexes.api.ts
│   ├── components/             # React components
│   │   ├── agents/            # Agent management components
│   │   ├── chat/              # Chat interface components
│   │   ├── documents/         # Document management components
│   │   ├── errors/            # Error boundary
│   │   ├── indexes/           # Index management components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Reusable UI components
│   ├── pages/                 # Page components (lazy-loaded)
│   │   ├── HomePage.tsx
│   │   ├── AgentsPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── IndexesPage.tsx
│   │   └── ChatPage.tsx
│   ├── store/                 # Zustand state management
│   │   ├── agentStore.ts
│   │   ├── chatStore.ts
│   │   ├── documentStore.ts
│   │   └── indexStore.ts
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   │   ├── security.ts        # Security utilities
│   │   ├── storage.ts         # Safe localStorage
│   │   └── errorHandler.ts   # Error handling
│   ├── App.tsx
│   ├── router.tsx             # Route configuration
│   └── main.tsx
├── dist/                      # Production build output
├── .env                       # Environment variables
├── .env.production            # Production environment
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🎯 Usage Guide

### 1. Create a Vector Index
1. Navigate to **Indexes** page
2. Click **"Create Index"**
3. Enter index name (lowercase, alphanumeric, hyphens)
4. Set dimension (default: 384)
5. Choose distance metric (cosine/euclidean/dotproduct)

### 2. Upload Documents
1. Navigate to **Documents** page
2. Drag & drop PDF files or click to browse
3. After upload, select documents and **"Add to Index"**
4. Or use **"Update from Directory"** to add all documents

### 3. Create an AI Agent
1. Navigate to **Agents** page
2. Click **"Create Agent"**
3. Fill in the form:
   - **Name**: Agent name
   - **System Instruction**: Behavior and constraints
   - **Index**: Select a vector index (optional, enables RAG)
   - **Temperature**: 0 (focused) to 2 (creative)
   - **Max Tokens**: Response length limit

### 4. Chat with Agent
1. Navigate to **Chat** page
2. Select an agent from the dropdown
3. Type your message and press Enter
4. View AI response with:
   - Execution time
   - Retrieved context (if RAG enabled)
   - Copy to clipboard button

---

## 🔒 Security Best Practices

### Input Validation
All user inputs are validated and sanitized:
```typescript
// Automatic sanitization in chatStore
const validation = validateMessage(query);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}
```

### Rate Limiting
API calls are rate-limited to prevent abuse:
- **Limit**: 10 requests per minute
- **Feedback**: User is notified when limit is exceeded

### localStorage Security
- Data is validated before loading
- Content is sanitized before storage
- Version control for data migration
- Automatic quota management

---

## ⚡ Performance Tips

### Bundle Size
The application uses code splitting:
- Initial load: ~59 KB (gzipped main bundle)
- Routes lazy-loaded on demand
- Vendor chunks cached separately

### Caching Strategy
```bash
# Static assets (1 year)
/assets/*.js, *.css, *.woff2

# HTML (no cache)
/index.html
```

### Best Practices
1. Use React DevTools Profiler to identify bottlenecks
2. Monitor bundle size after adding dependencies
3. Use `React.memo` for expensive components
4. Implement virtualization for long lists (if needed)

---

## 🧪 Testing

### Manual Testing Checklist

**Agent Management:**
- [ ] Create agent with valid inputs
- [ ] Create agent with invalid inputs (should show errors)
- [ ] Edit agent system instructions
- [ ] Delete agent with confirmation
- [ ] Execute agent (navigate to chat)

**Document Management:**
- [ ] Upload PDF (< 15MB)
- [ ] Upload oversized file (should reject)
- [ ] Upload non-PDF file (should reject)
- [ ] Add document to index
- [ ] Delete document

**Index Management:**
- [ ] Create index with valid name
- [ ] Create index with invalid name (should reject)
- [ ] View index details
- [ ] Delete index

**Chat Interface:**
- [ ] Send message to agent
- [ ] Verify rate limiting (send 11 messages quickly)
- [ ] Verify chat history persistence (refresh page)
- [ ] View context documents (if RAG enabled)
- [ ] Copy AI response to clipboard
- [ ] Clear chat history

**Error Handling:**
- [ ] Verify error boundary catches crashes
- [ ] Check network error handling (disconnect internet)
- [ ] Verify localStorage quota handling

---

## 🐛 Troubleshooting

### Common Issues

#### API Connection Errors
**Problem**: Cannot connect to backend API

**Solution**:
1. Verify backend is running: `http://localhost:8000`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Restart dev server after changing `.env`

#### Build Fails
**Problem**: TypeScript errors during build

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### localStorage Quota Exceeded
**Problem**: "QuotaExceededError" in console

**Solution**:
- Application automatically clears oldest data
- Manually clear: DevTools > Application > Storage > Clear Site Data

#### Rate Limiting
**Problem**: "Too many requests" error

**Solution**:
- Wait 1 minute before retrying
- Rate limit: 10 requests/minute per user

---

## 📊 Production Deployment

### Build for Production

```bash
# Install dependencies
npm ci --production=false

# Build
npm run build

# Output in dist/ folder
```

### Environment Configuration

Update `.env.production`:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_MAX_FILE_SIZE=15728640
```

### Deployment Checklist

- [ ] Update API URL in `.env.production`
- [ ] Run production build: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Verify all features work
- [ ] Check console for errors
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Set up SSL certificate
- [ ] Configure CORS on backend

### Recommended Hosting

- **Vercel**: Zero-config deployment
- **Netlify**: Continuous deployment
- **AWS S3 + CloudFront**: Scalable static hosting
- **Nginx**: Traditional server setup

---

## 🔧 Configuration

### Customization

#### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        600: '#your-color',  // Main brand color
        // ...
      },
    },
  },
}
```

#### Adjust Rate Limiting
Edit `src/store/chatStore.ts`:
```typescript
const rateLimiter = new RateLimiter(10, 60000); 
// Change to: new RateLimiter(requests, timeInMs)
```

#### Change Max Message Limit
Edit `src/utils/storage.ts`:
```typescript
const MAX_MESSAGES_PER_AGENT = 100;
// Adjust as needed
```

---

## 📈 Monitoring & Analytics

### Add Error Reporting (Sentry)
```bash
npm install @sentry/react

# In src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-dsn",
  environment: import.meta.env.MODE,
});
```

### Add Analytics (Google Analytics)
```bash
npm install react-ga4

# In src/main.tsx
import ReactGA from "react-ga4";

ReactGA.initialize("your-measurement-id");
```

---

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript strict mode
2. Use `React.memo` for expensive components
3. Sanitize all user inputs with `sanitizeInput()`
4. Use `safeSetItem()` for localStorage
5. Add proper error handling
6. Write descriptive commit messages

### Code Style

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
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

- React & Vite teams
- Tailwind CSS
- Zustand for state management
- All open-source contributors

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
