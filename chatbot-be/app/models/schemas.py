from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Document Schemas
class DocumentUpload(BaseModel):
    """Schema for document upload"""
    filename: str = Field(..., description="Name of the PDF file")


class DocumentResponse(BaseModel):
    """Schema for document response"""
    filename: str
    file_path: str
    size_bytes: int
    uploaded_at: datetime


class DocumentList(BaseModel):
    """Schema for list of documents"""
    documents: List[DocumentResponse]
    total: int


# Index Schemas
class IndexCreate(BaseModel):
    """Schema for creating a new index"""
    index_name: str = Field(..., description="Name of the index")
    dimension: Optional[int] = Field(None, description="Vector dimension (auto-detected if not provided)")
    metric: str = Field(default="cosine", description="Distance metric")


class IndexInfo(BaseModel):
    """Schema for index information"""
    name: str
    dimension: int
    metric: str
    total_vector_count: int
    status: str


class IndexList(BaseModel):
    """Schema for list of indexes"""
    indexes: List[IndexInfo]
    total: int


# Agent Schemas
class AgentCreate(BaseModel):
    """Schema for creating an agent"""
    name: str = Field(..., description="Agent name")
    system_instruction: str = Field(..., description="System instruction for the agent")
    index_name: Optional[str] = Field(None, description="Index to attach to the agent")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, description="Maximum tokens in response")


class AgentUpdate(BaseModel):
    """Schema for updating an agent"""
    system_instruction: Optional[str] = None
    index_name: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = None


class AgentResponse(BaseModel):
    """Schema for agent response"""
    agent_id: str
    name: str
    system_instruction: str
    index_name: Optional[str]
    temperature: float
    max_tokens: Optional[int]
    created_at: datetime
    updated_at: datetime


class AgentList(BaseModel):
    """Schema for list of agents"""
    agents: List[AgentResponse]
    total: int


# Agent Execution Schemas
class AgentExecuteRequest(BaseModel):
    """Schema for agent execution request"""
    query: str = Field(..., description="User query")
    agent_id: str = Field(..., description="ID of the agent to execute")


class AgentExecuteResponse(BaseModel):
    """Schema for agent execution response"""
    agent_id: str
    query: str
    answer: str
    context_documents: Optional[List[Dict[str, Any]]] = None
    execution_time_ms: float


# Index Update Schemas
class IndexUpdateRequest(BaseModel):
    """Schema for updating an index with new documents"""
    index_name: str
    document_paths: List[str]


# Generic Response Schemas
class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    success: bool = False
