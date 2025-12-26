"""
Documents API endpoints with comprehensive error handling
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict
from app.models.schemas import DocumentResponse, DocumentList, MessageResponse
from app.services.document_service import DocumentService
from app.services.index_service import IndexService
from app.core.logger import get_logger
from app.core.exceptions import (
    DocumentNotFoundError,
    InvalidDocumentError,
    DocumentUploadError,
    StorageException
)
from pydantic import BaseModel

logger = get_logger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])
document_service = DocumentService()
index_service = IndexService()


class DocumentIndexCheckRequest(BaseModel):
    """Request model for checking document indexes"""
    document_paths: List[str]


class DocumentIndexCheckResponse(BaseModel):
    """Response model for document index check"""
    document_indexes: Dict[str, List[str]]  # {file_path: [index_names]}


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF document to the data directory

    Args:
        file: PDF file to upload (max 15MB)

    Returns:
        Document metadata

    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    try:
        logger.info(f"Uploading document: {file.filename}")
        result = document_service.upload_document(file)
        logger.info(f"Document uploaded successfully: {result.filename}")
        return result
    except InvalidDocumentError as e:
        logger.warning(f"Invalid document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentUploadError as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except StorageException as e:
        logger.error(f"Storage error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error uploading document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading document: {str(e)}"
        )


@router.get("/", response_model=DocumentList)
async def list_documents():
    """
    List all PDF documents in the data directory (FAST - without index information)

    This endpoint only returns document metadata without checking which indexes
    contain each document. For index information, use the POST /documents/check-indexes
    endpoint separately.

    Returns:
        List of documents with metadata (indexed_in will be empty)

    Raises:
        HTTPException: 500 for server errors
    """
    try:
        logger.info("[Documents API] Fetching document list")
        documents = document_service.list_documents()

        # Set indexed_in to empty list for all documents (will be populated by separate API)
        for doc in documents:
            doc.indexed_in = []

        logger.info(f"[Documents API] Successfully listed {len(documents)} documents")
        return DocumentList(documents=documents, total=len(documents))
    except StorageException as e:
        logger.error(f"[Documents API] Storage error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"[Documents API] Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
        )


@router.post("/check-indexes", response_model=DocumentIndexCheckResponse)
async def check_document_indexes(request: DocumentIndexCheckRequest):
    """
    Check which indexes contain the specified documents (ASYNC)

    This endpoint is separated from the list endpoint to avoid slow response times.
    Call this AFTER getting the document list to populate index information asynchronously.

    Args:
        request: List of document paths to check

    Returns:
        Dictionary mapping document paths to lists of index names

    Example:
        Request: {"document_paths": ["https://blob.../file1.pdf", "https://blob.../file2.pdf"]}
        Response: {
            "document_indexes": {
                "https://blob.../file1.pdf": ["index1", "index2"],
                "https://blob.../file2.pdf": ["index1"]
            }
        }
    """
    try:
        logger.info(f"[Documents API] Checking indexes for {len(request.document_paths)} documents")

        document_indexes = {}

        for file_path in request.document_paths:
            try:
                # Extract filename for logging
                if '/' in file_path:
                    filename = file_path.split('/')[-1]
                elif '\\' in file_path:
                    filename = file_path.split('\\')[-1]
                else:
                    filename = file_path

                logger.debug(f"[Documents API] Checking indexes for: {filename}")

                # Check which indexes contain this document
                indexed_in = index_service.get_indexes_containing_document(file_path)
                document_indexes[file_path] = indexed_in

                logger.debug(f"[Documents API] {filename} found in {len(indexed_in)} indexes")

            except Exception as e:
                logger.warning(f"[Documents API] Error checking indexes for {file_path}: {str(e)}")
                document_indexes[file_path] = []  # Set empty list on error

        logger.info(f"[Documents API] Successfully checked indexes for {len(document_indexes)} documents")
        return DocumentIndexCheckResponse(document_indexes=document_indexes)

    except Exception as e:
        logger.error(f"[Documents API] Error checking document indexes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error checking document indexes: {str(e)}"
        )


@router.delete("/{filename}", response_model=MessageResponse)
async def delete_document(filename: str):
    """
    Delete a PDF document

    Args:
        filename: Name of the document to delete

    Returns:
        Success message

    Raises:
        HTTPException: 404 if document not found, 500 for server errors
    """
    try:
        logger.info(f"Deleting document: {filename}")
        success = document_service.delete_document(filename)
        if not success:
            raise HTTPException(status_code=404, detail=f"Document {filename} not found")

        logger.info(f"Document deleted successfully: {filename}")
        return MessageResponse(
            message=f"Document {filename} deleted successfully",
            success=True
        )
    except DocumentNotFoundError as e:
        logger.warning(f"Document not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except StorageException as e:
        logger.error(f"Storage error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )
