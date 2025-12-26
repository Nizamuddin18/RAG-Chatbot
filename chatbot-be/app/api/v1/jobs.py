from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
import json
from app.models.schemas import JobResponse
from app.services.job_service import get_job_service, JobStatus
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])
job_service = get_job_service()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get the status of a background job"""
    try:
        job = job_service.get_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

        return JobResponse(
            job_id=job.job_id,
            job_type=job.job_type,
            status=job.status.value,
            progress=job.progress,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            result=job.result,
            error=job.error
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting job status: {str(e)}")


@router.get("/{job_id}/stream")
async def stream_job_status(job_id: str):
    """
    Stream job status updates via Server-Sent Events (SSE).

    This endpoint establishes a long-lived connection that pushes real-time
    job status updates to the client as they happen.

    Args:
        job_id: The job identifier to stream updates for

    Returns:
        StreamingResponse with Server-Sent Events

    Event format:
        data: {"job_id": "...", "status": "running", "progress": 50, ...}

    The stream closes when:
    - Job reaches COMPLETED or FAILED status
    - Client disconnects
    - 5 minutes timeout (safety)
    """
    logger.info(f"[SSE] Client connected to stream for job {job_id}")

    async def event_generator():
        queue = None  # Initialize queue variable in outer scope
        try:
            # Check if job exists
            job = job_service.get_job(job_id)
            if not job:
                logger.error(f"[SSE] Job {job_id} not found")
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                return

            # Send initial status
            initial_data = job.to_dict()
            logger.info(f"[SSE] Sending initial status for job {job_id}: {initial_data}")
            yield f"data: {json.dumps(initial_data)}\n\n"

            # If job already completed, close stream
            if job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
                logger.info(f"[SSE] Job {job_id} already completed, closing stream")
                return

            # Subscribe to job updates
            queue = job_service.subscribe_to_job(job_id)
            logger.info(f"[SSE] Subscribed to updates for job {job_id}")
        except Exception as e:
            logger.error(f"[SSE] Error in initial setup for job {job_id}: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        try:
            # Stream updates until job completes (with 5 minute timeout)
            timeout = 300  # 5 minutes max
            start_time = asyncio.get_event_loop().time()

            while True:
                # Check timeout
                if asyncio.get_event_loop().time() - start_time > timeout:
                    logger.warning(f"Stream timeout for job {job_id}")
                    yield f"data: {json.dumps({'error': 'Stream timeout'})}\n\n"
                    break

                try:
                    # Wait for update with timeout
                    job_data = await asyncio.wait_for(queue.get(), timeout=30)

                    # Send update
                    logger.info(f"[SSE] Sending update for job {job_id}: status={job_data['status']}, progress={job_data['progress']}")
                    yield f"data: {json.dumps(job_data)}\n\n"

                    # Close stream if job completed
                    if job_data['status'] in ('completed', 'failed'):
                        logger.info(f"[SSE] Job {job_id} finished, closing stream")
                        break

                except asyncio.TimeoutError:
                    # Send keepalive ping every 30 seconds
                    yield f": keepalive\n\n"

                except Exception as e:
                    logger.error(f"[SSE] Error in stream loop for job {job_id}: {str(e)}", exc_info=True)
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    break

        except Exception as e:
            logger.error(f"[SSE] Fatal error in stream for job {job_id}: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            # Unsubscribe when stream closes
            if queue is not None:
                try:
                    job_service.unsubscribe_from_job(job_id, queue)
                    logger.debug(f"[SSE] Stream closed for job {job_id}")
                except Exception as e:
                    logger.error(f"[SSE] Error during cleanup for job {job_id}: {str(e)}")
            else:
                logger.debug(f"[SSE] Stream closed for job {job_id} (queue was not initialized)")

    try:
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    except Exception as e:
        logger.error(f"Error starting stream for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting stream: {str(e)}")
