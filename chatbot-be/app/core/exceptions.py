"""
Custom exception classes for the RAG Chatbot API
"""


class ChatbotBaseException(Exception):
    """Base exception for all chatbot errors"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DocumentException(ChatbotBaseException):
    """Exceptions related to document operations"""
    pass


class DocumentNotFoundError(DocumentException):
    """Document not found"""
    pass


class InvalidDocumentError(DocumentException):
    """Invalid document format or content"""
    pass


class DocumentUploadError(DocumentException):
    """Error during document upload"""
    pass


class IndexException(ChatbotBaseException):
    """Exceptions related to index operations"""
    pass


class IndexNotFoundError(IndexException):
    """Index not found"""
    pass


class IndexCreationError(IndexException):
    """Error creating index"""
    pass


class IndexUpdateError(IndexException):
    """Error updating index"""
    pass


class AgentException(ChatbotBaseException):
    """Exceptions related to agent operations"""
    pass


class AgentNotFoundError(AgentException):
    """Agent not found"""
    pass


class AgentExecutionError(AgentException):
    """Error during agent execution"""
    pass


class AgentConfigurationError(AgentException):
    """Invalid agent configuration"""
    pass


class ExternalServiceException(ChatbotBaseException):
    """Exceptions related to external services"""
    pass


class AzureOpenAIError(ExternalServiceException):
    """Azure OpenAI API error"""
    pass


class PineconeError(ExternalServiceException):
    """Pinecone API error"""
    pass


class EmbeddingError(ExternalServiceException):
    """Embedding model error"""
    pass


class ValidationException(ChatbotBaseException):
    """Input validation errors"""
    pass


class StorageException(ChatbotBaseException):
    """File system or storage errors"""
    pass
