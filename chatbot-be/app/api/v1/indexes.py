from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import (
    IndexCreate,
    IndexInfo,
    IndexList,
    IndexUpdateRequest,
    MessageResponse
)
from app.services.index_service import IndexService
from app.services.document_service import DocumentService
from app.core.logger import get_logger
from app.core.config import get_settings

logger = get_logger(__name__)
router = APIRouter(prefix="/indexes", tags=["Indexes"])
index_service = IndexService()
document_service = DocumentService()
settings = get_settings()


@router.get("/", response_model=IndexList)
async def list_indexes():
    """List all Pinecone indexes"""
    try:
        indexes = index_service.list_indexes()
        return IndexList(indexes=indexes, total=len(indexes))
    except Exception as e:
        logger.error(f"Error listing indexes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing indexes: {str(e)}")


@router.get("/{index_name}", response_model=IndexInfo)
async def get_index_details(index_name: str):
    """Get details of a specific index"""
    try:
        index_info = index_service.get_index_details(index_name)
        if not index_info:
            raise HTTPException(status_code=404, detail=f"Index {index_name} not found")
        return index_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting index details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting index details: {str(e)}")


@router.post("/", response_model=IndexInfo)
async def create_index(index_data: IndexCreate):
    """Create a new Pinecone index"""
    try:
        index_info = index_service.create_index(index_data)
        return index_info
    except Exception as e:
        logger.error(f"Error creating index: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating index: {str(e)}")


@router.delete("/{index_name}", response_model=MessageResponse)
async def delete_index(index_name: str):
    """Delete a Pinecone index"""
    try:
        success = index_service.delete_index(index_name)
        if not success:
            raise HTTPException(status_code=404, detail=f"Index {index_name} not found")

        return MessageResponse(
            message=f"Index {index_name} deleted successfully",
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting index: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting index: {str(e)}")


@router.post("/{index_name}/update", response_model=IndexInfo)
async def update_index_with_documents(index_name: str, document_paths: List[str]):
    """Update an index with specific documents"""
    try:
        index_info = index_service.update_index_with_documents(index_name, document_paths)
        return index_info
    except Exception as e:
        logger.error(f"Error updating index: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating index: {str(e)}")


@router.post("/{index_name}/update-from-directory", response_model=IndexInfo)
async def update_index_from_directory(index_name: str):
    """Update an index with all documents from the data directory"""
    try:
        index_info = index_service.update_index_with_directory(index_name, settings.DATA_DIR)
        return index_info
    except Exception as e:
        logger.error(f"Error updating index from directory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating index from directory: {str(e)}")
