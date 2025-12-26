"""
Job Service for managing background tasks
"""
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List, Callable
from enum import Enum
from app.core.logger import get_logger

logger = get_logger(__name__)


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Job:
    """Job model for tracking background tasks"""

    def __init__(self, job_id: str, job_type: str, parameters: Dict[str, Any]):
        self.job_id = job_id
        self.job_type = job_type
        self.parameters = parameters
        self.status = JobStatus.PENDING
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.progress: int = 0  # 0-100

    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary"""
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status.value,
            "progress": self.progress,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "result": self.result,
            "error": self.error
        }


class JobService:
    """Service for managing background jobs"""

    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._listeners: Dict[str, List[asyncio.Queue]] = {}

    def create_job(self, job_type: str, parameters: Dict[str, Any]) -> str:
        """
        Create a new job

        Args:
            job_type: Type of job (e.g., "index_update")
            parameters: Job parameters

        Returns:
            Job ID
        """
        job_id = str(uuid.uuid4())
        job = Job(job_id, job_type, parameters)
        self._jobs[job_id] = job

        logger.info(f"Created job {job_id} of type {job_type}")
        return job_id

    def get_job(self, job_id: str) -> Optional[Job]:
        """Get job by ID"""
        return self._jobs.get(job_id)

    def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        progress: Optional[int] = None,
        error: Optional[str] = None
    ):
        """Update job status"""
        job = self._jobs.get(job_id)
        if not job:
            logger.warning(f"Job {job_id} not found")
            return

        job.status = status

        if progress is not None:
            job.progress = progress

        if status == JobStatus.RUNNING and not job.started_at:
            job.started_at = datetime.utcnow()

        if status in (JobStatus.COMPLETED, JobStatus.FAILED):
            job.completed_at = datetime.utcnow()

        if error:
            job.error = error

        logger.info(f"Job {job_id} status updated to {status.value} (progress: {job.progress}%)")

        # Notify listeners
        self._notify_listeners(job_id)

    def set_job_result(self, job_id: str, result: Any):
        """Set job result"""
        job = self._jobs.get(job_id)
        if job:
            job.result = result
            logger.info(f"Job {job_id} result set")

    def subscribe_to_job(self, job_id: str) -> asyncio.Queue:
        """Subscribe to job updates via a queue"""
        if job_id not in self._listeners:
            self._listeners[job_id] = []

        queue = asyncio.Queue()
        self._listeners[job_id].append(queue)
        logger.debug(f"Listener subscribed to job {job_id}")
        return queue

    def unsubscribe_from_job(self, job_id: str, queue: asyncio.Queue):
        """Unsubscribe from job updates"""
        if job_id in self._listeners and queue in self._listeners[job_id]:
            self._listeners[job_id].remove(queue)
            logger.debug(f"Listener unsubscribed from job {job_id}")

            # Clean up empty listener lists
            if not self._listeners[job_id]:
                del self._listeners[job_id]

    def _notify_listeners(self, job_id: str):
        """Notify all listeners about job update"""
        if job_id not in self._listeners:
            return

        job = self._jobs.get(job_id)
        if not job:
            return

        job_data = job.to_dict()

        # Put update in all listener queues (non-blocking)
        for queue in self._listeners[job_id]:
            try:
                queue.put_nowait(job_data)
            except asyncio.QueueFull:
                logger.warning(f"Queue full for job {job_id}, skipping update")

    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Clean up jobs older than max_age_hours"""
        now = datetime.utcnow()
        to_delete = []

        for job_id, job in self._jobs.items():
            age_hours = (now - job.created_at).total_seconds() / 3600
            if age_hours > max_age_hours:
                to_delete.append(job_id)

        for job_id in to_delete:
            del self._jobs[job_id]
            # Also clean up listeners
            if job_id in self._listeners:
                del self._listeners[job_id]

        if to_delete:
            logger.info(f"Cleaned up {len(to_delete)} old jobs")


# Global job service instance
_job_service = JobService()


def get_job_service() -> JobService:
    """Get the global job service instance"""
    return _job_service
