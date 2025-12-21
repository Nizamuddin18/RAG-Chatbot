from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.models.schemas import DocumentResponse, DocumentList, MessageResponse, ErrorResponse
from app.services.document_service import DocumentService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])
document_service = DocumentService()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF document to the data directory"""
    try:
        logger.info(f"Uploading document: {file.filename}")
        result = document_service.upload_document(file)
        return result
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.get("/", response_model=DocumentList)
async def list_documents():
    """List all PDF documents in the data directory"""
    try:
        documents = document_service.list_documents()
        return DocumentList(documents=documents, total=len(documents))
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")


@router.delete("/{filename}", response_model=MessageResponse)
async def delete_document(filename: str):
    """Delete a PDF document"""
    try:
        success = document_service.delete_document(filename)
        if not success:
            raise HTTPException(status_code=404, detail=f"Document {filename} not found")

        return MessageResponse(
            message=f"Document {filename} deleted successfully",
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
