import os
import shutil
from typing import List
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile
from app.core.logger import get_logger
from app.core.config import get_settings
from app.models.schemas import DocumentResponse

logger = get_logger(__name__)
settings = get_settings()


class DocumentService:
    """Service for managing PDF documents"""

    def __init__(self):
        self.data_dir = Path(settings.DATA_DIR)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def upload_document(self, file: UploadFile) -> DocumentResponse:
        """Upload a PDF document to the data directory"""
        try:
            if not file.filename.endswith('.pdf'):
                raise ValueError("Only PDF files are allowed")

            file_path = self.data_dir / file.filename
            logger.info(f"Uploading document: {file.filename}")

            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Get file stats
            file_stats = file_path.stat()

            response = DocumentResponse(
                filename=file.filename,
                file_path=str(file_path),
                size_bytes=file_stats.st_size,
                uploaded_at=datetime.fromtimestamp(file_stats.st_mtime)
            )

            logger.info(f"Document uploaded successfully: {file.filename}")
            return response
        except Exception as e:
            logger.error(f"Error uploading document {file.filename}: {str(e)}")
            raise

    def list_documents(self) -> List[DocumentResponse]:
        """List all PDF documents in the data directory"""
        try:
            logger.info("Listing all documents")
            documents = []

            for file_path in self.data_dir.glob("*.pdf"):
                file_stats = file_path.stat()
                documents.append(
                    DocumentResponse(
                        filename=file_path.name,
                        file_path=str(file_path),
                        size_bytes=file_stats.st_size,
                        uploaded_at=datetime.fromtimestamp(file_stats.st_mtime)
                    )
                )

            logger.info(f"Found {len(documents)} documents")
            return documents
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            raise

    def delete_document(self, filename: str) -> bool:
        """Delete a PDF document"""
        try:
            file_path = self.data_dir / filename
            if not file_path.exists():
                logger.warning(f"Document not found: {filename}")
                return False

            logger.info(f"Deleting document: {filename}")
            file_path.unlink()
            logger.info(f"Document deleted successfully: {filename}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {filename}: {str(e)}")
            raise

    def get_document_path(self, filename: str) -> str:
        """Get the full path of a document"""
        return str(self.data_dir / filename)

    def get_all_document_paths(self) -> List[str]:
        """Get paths of all PDF documents"""
        return [str(path) for path in self.data_dir.glob("*.pdf")]
