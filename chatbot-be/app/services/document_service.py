"""
Document Service with comprehensive error handling and validation
"""
import os
import shutil
from typing import List
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile
from app.core.logger import get_logger, LoggerMixin
from app.core.config import get_settings
from app.core.exceptions import (
    DocumentNotFoundError,
    InvalidDocumentError,
    DocumentUploadError,
    StorageException
)
from app.models.schemas import DocumentResponse

logger = get_logger(__name__)
settings = get_settings()

# Constants
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB
ALLOWED_EXTENSIONS = {'.pdf'}


class DocumentService(LoggerMixin):
    """Service for managing PDF documents"""

    def __init__(self):
        self.data_dir = Path(settings.DATA_DIR)
        self._ensure_data_dir()

    def _ensure_data_dir(self) -> None:
        """Ensure data directory exists"""
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Data directory ensured: {self.data_dir}")
        except Exception as e:
            self.log_operation_error("ensure_data_dir", e)
            raise StorageException(
                f"Failed to create data directory: {str(e)}",
                details={"data_dir": str(self.data_dir)}
            )

    def _validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file

        Args:
            file: Uploaded file

        Raises:
            InvalidDocumentError: If validation fails
        """
        # Check if filename exists
        if not file.filename:
            raise InvalidDocumentError("No filename provided")

        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise InvalidDocumentError(
                f"Invalid file type: {file_ext}. Only PDF files are allowed",
                details={"filename": file.filename, "extension": file_ext}
            )

        # Check file size if available
        if hasattr(file, 'size') and file.size:
            if file.size > MAX_FILE_SIZE:
                raise InvalidDocumentError(
                    f"File too large: {file.size} bytes (max {MAX_FILE_SIZE} bytes)",
                    details={"filename": file.filename, "size": file.size}
                )

    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        # Remove any directory components
        safe_filename = os.path.basename(filename)

        # Remove any potentially dangerous characters
        safe_filename = "".join(
            c for c in safe_filename
            if c.isalnum() or c in ('-', '_', '.')
        )

        return safe_filename

    def upload_document(self, file: UploadFile) -> DocumentResponse:
        """
        Upload a PDF document to the data directory

        Args:
            file: Uploaded PDF file

        Returns:
            Document response with metadata

        Raises:
            InvalidDocumentError: If file validation fails
            DocumentUploadError: If upload fails
            StorageException: If storage operation fails
        """
        try:
            self.log_operation_start("upload_document", filename=file.filename)

            # Validate file
            self._validate_file(file)

            # Sanitize filename
            safe_filename = self._sanitize_filename(file.filename)
            if not safe_filename:
                raise InvalidDocumentError("Invalid filename after sanitization")

            file_path = self.data_dir / safe_filename

            # Check if file already exists
            if file_path.exists():
                self.logger.warning(
                    f"File already exists, will overwrite: {safe_filename}",
                    extra={"filename": safe_filename}
                )

            # Save file
            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
            except Exception as e:
                raise StorageException(
                    f"Failed to write file to disk: {str(e)}",
                    details={"filename": safe_filename, "path": str(file_path)}
                )

            # Get file stats
            try:
                file_stats = file_path.stat()
            except Exception as e:
                raise StorageException(
                    f"Failed to get file statistics: {str(e)}",
                    details={"filename": safe_filename}
                )

            response = DocumentResponse(
                filename=safe_filename,
                file_path=str(file_path),
                size_bytes=file_stats.st_size,
                uploaded_at=datetime.fromtimestamp(file_stats.st_mtime)
            )

            self.log_operation_success(
                "upload_document",
                filename=safe_filename,
                size_bytes=file_stats.st_size
            )

            return response

        except (InvalidDocumentError, DocumentUploadError, StorageException):
            raise
        except Exception as e:
            self.log_operation_error("upload_document", e, filename=file.filename)
            raise DocumentUploadError(
                f"Unexpected error during upload: {str(e)}",
                details={"filename": file.filename}
            )

    def list_documents(self) -> List[DocumentResponse]:
        """
        List all PDF documents in the data directory

        Returns:
            List of document responses

        Raises:
            StorageException: If directory read fails
        """
        try:
            self.log_operation_start("list_documents")
            documents = []

            for file_path in self.data_dir.glob("*.pdf"):
                try:
                    file_stats = file_path.stat()
                    documents.append(
                        DocumentResponse(
                            filename=file_path.name,
                            file_path=str(file_path),
                            size_bytes=file_stats.st_size,
                            uploaded_at=datetime.fromtimestamp(file_stats.st_mtime)
                        )
                    )
                except Exception as e:
                    self.logger.warning(
                        f"Error reading file stats for {file_path.name}: {str(e)}",
                        extra={"filename": file_path.name}
                    )
                    continue

            self.log_operation_success("list_documents", count=len(documents))
            return documents

        except Exception as e:
            self.log_operation_error("list_documents", e)
            raise StorageException(
                f"Failed to list documents: {str(e)}",
                details={"data_dir": str(self.data_dir)}
            )

    def delete_document(self, filename: str) -> bool:
        """
        Delete a PDF document

        Args:
            filename: Name of the document to delete

        Returns:
            True if deleted successfully

        Raises:
            DocumentNotFoundError: If document doesn't exist
            StorageException: If deletion fails
        """
        try:
            # Sanitize filename to prevent path traversal
            safe_filename = self._sanitize_filename(filename)
            file_path = self.data_dir / safe_filename

            self.log_operation_start("delete_document", filename=safe_filename)

            if not file_path.exists():
                self.logger.warning(f"Document not found: {safe_filename}")
                raise DocumentNotFoundError(
                    f"Document {safe_filename} not found",
                    details={"filename": safe_filename, "path": str(file_path)}
                )

            # Ensure the file is within data_dir (additional security check)
            try:
                file_path.resolve().relative_to(self.data_dir.resolve())
            except ValueError:
                raise StorageException(
                    "Invalid file path",
                    details={"filename": safe_filename}
                )

            try:
                file_path.unlink()
            except Exception as e:
                raise StorageException(
                    f"Failed to delete file: {str(e)}",
                    details={"filename": safe_filename}
                )

            self.log_operation_success("delete_document", filename=safe_filename)
            return True

        except DocumentNotFoundError:
            raise
        except Exception as e:
            self.log_operation_error("delete_document", e, filename=filename)
            raise StorageException(
                f"Unexpected error during deletion: {str(e)}",
                details={"filename": filename}
            )

    def get_document_path(self, filename: str) -> str:
        """
        Get the full path of a document

        Args:
            filename: Document filename

        Returns:
            Full path to document

        Raises:
            DocumentNotFoundError: If document doesn't exist
        """
        safe_filename = self._sanitize_filename(filename)
        file_path = self.data_dir / safe_filename

        if not file_path.exists():
            raise DocumentNotFoundError(
                f"Document {safe_filename} not found",
                details={"filename": safe_filename}
            )

        return str(file_path)

    def get_all_document_paths(self) -> List[str]:
        """
        Get paths of all PDF documents

        Returns:
            List of document paths

        Raises:
            StorageException: If directory read fails
        """
        try:
            paths = [str(path) for path in self.data_dir.glob("*.pdf")]
            self.logger.info(f"Found {len(paths)} document paths")
            return paths
        except Exception as e:
            self.log_operation_error("get_all_document_paths", e)
            raise StorageException(
                f"Failed to get document paths: {str(e)}",
                details={"data_dir": str(self.data_dir)}
            )
