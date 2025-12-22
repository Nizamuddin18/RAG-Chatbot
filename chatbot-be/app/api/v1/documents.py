"""
Documents API endpoints with comprehensive error handling
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import DocumentResponse, DocumentList, MessageResponse
from app.services.document_service import DocumentService
from app.core.logger import get_logger
from app.core.exceptions import (
    DocumentNotFoundError,
    InvalidDocumentError,
    DocumentUploadError,
    StorageException
)

logger = get_logger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])
document_service = DocumentService()


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
    List all PDF documents in the data directory

    Returns:
        List of documents with metadata

    Raises:
        HTTPException: 500 for server errors
    """
    try:
        documents = document_service.list_documents()
        logger.info(f"Listed {len(documents)} documents")
        return DocumentList(documents=documents, total=len(documents))
    except StorageException as e:
        logger.error(f"Storage error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
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
