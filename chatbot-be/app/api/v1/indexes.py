from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models.schemas import (
    IndexCreate,
    IndexInfo,
    IndexList,
    IndexUpdateRequest,
    MessageResponse,
    JobCreateResponse
)
from app.services.index_service import IndexService
from app.services.document_service import DocumentService
from app.services.job_service import get_job_service, JobStatus
from app.core.logger import get_logger
from app.core.config import get_settings

logger = get_logger(__name__)
router = APIRouter(prefix="/indexes", tags=["Indexes"])
index_service = IndexService()
document_service = DocumentService()
settings = get_settings()
job_service = get_job_service()


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


def _process_index_update(job_id: str, index_name: str, document_paths: List[str]):
    """Background task to process index update"""
    try:
        logger.info(f"Starting background index update job {job_id}")
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=10)

        # Update: Downloading documents
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=30)

        # Process the index update
        # Update: Processing documents
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=50)

        index_info = index_service.update_index_with_documents(index_name, document_paths)

        # Update: Finalizing
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=90)

        # Set result and mark as completed
        job_service.set_job_result(job_id, index_info.model_dump())
        job_service.update_job_status(job_id, JobStatus.COMPLETED, progress=100)
        logger.info(f"Background index update job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Error in background index update job {job_id}: {str(e)}")
        job_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error=str(e)
        )


@router.post("/{index_name}/update", response_model=JobCreateResponse, status_code=202)
async def update_index_with_documents(
    index_name: str,
    document_paths: List[str],
    background_tasks: BackgroundTasks
):
    """Update an index with specific documents (async operation)"""
    try:
        # Create a job
        job_id = job_service.create_job(
            job_type="index_update",
            parameters={
                "index_name": index_name,
                "document_paths": document_paths
            }
        )

        # Add background task
        background_tasks.add_task(
            _process_index_update,
            job_id,
            index_name,
            document_paths
        )

        logger.info(f"Created index update job {job_id} for index {index_name}")

        return JobCreateResponse(
            job_id=job_id,
            status="accepted",
            message=f"Index update job created. Use GET /api/v1/jobs/{job_id} to check status."
        )

    except Exception as e:
        logger.error(f"Error creating index update job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating index update job: {str(e)}")


def _process_index_update_from_directory(job_id: str, index_name: str, directory_path: str):
    """Background task to process index update from directory"""
    try:
        logger.info(f"Starting background index update from directory job {job_id}")
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=10)

        # Update: Listing documents
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=20)

        # Update: Downloading documents
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=40)

        # Process the index update
        # Update: Processing documents
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=60)

        index_info = index_service.update_index_with_directory(index_name, directory_path)

        # Update: Finalizing
        job_service.update_job_status(job_id, JobStatus.RUNNING, progress=90)

        # Set result and mark as completed
        job_service.set_job_result(job_id, index_info.model_dump())
        job_service.update_job_status(job_id, JobStatus.COMPLETED, progress=100)
        logger.info(f"Background index update from directory job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Error in background index update from directory job {job_id}: {str(e)}")
        job_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error=str(e)
        )


@router.post("/{index_name}/update-from-directory", response_model=JobCreateResponse, status_code=202)
async def update_index_from_directory(
    index_name: str,
    background_tasks: BackgroundTasks
):
    """Update an index with all documents from Azure Blob Storage (async operation)"""
    try:
        # Create a job
        job_id = job_service.create_job(
            job_type="index_update_from_directory",
            parameters={
                "index_name": index_name,
                "directory_path": settings.DATA_DIR
            }
        )

        # Add background task
        background_tasks.add_task(
            _process_index_update_from_directory,
            job_id,
            index_name,
            settings.DATA_DIR
        )

        logger.info(f"Created index update from directory job {job_id} for index {index_name}")

        return JobCreateResponse(
            job_id=job_id,
            status="accepted",
            message=f"Index update from directory job created. Use GET /api/v1/jobs/{job_id} to check status."
        )

    except Exception as e:
        logger.error(f"Error creating index update from directory job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating index update from directory job: {str(e)}")
