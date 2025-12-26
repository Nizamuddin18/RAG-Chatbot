"""
Document Service with Azure Blob Storage integration
"""
import os
from typing import List
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile
from azure.storage.blob import BlobServiceClient, BlobProperties
from azure.core.exceptions import ResourceNotFoundError, AzureError
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
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
ALLOWED_EXTENSIONS = {'.pdf'}


class DocumentService(LoggerMixin):
    """Service for managing PDF documents in Azure Blob Storage"""

    def __init__(self):
        """Initialize Azure Blob Storage client"""
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                settings.AZURE_STORAGE_CONNECTION_STRING
            )
            self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME
            self.container_client = self.blob_service_client.get_container_client(
                self.container_name
            )

            # Verify container exists
            if not self.container_client.exists():
                raise StorageException(
                    f"Azure Blob Storage container '{self.container_name}' not found",
                    details={"container": self.container_name}
                )

            self.logger.info(
                f"Azure Blob Storage initialized: {self.container_name}",
                extra={"container": self.container_name}
            )
        except AzureError as e:
            self.log_operation_error("initialize_azure_storage", e)
            raise StorageException(
                f"Failed to initialize Azure Blob Storage: {str(e)}",
                details={"container": self.container_name}
            )
        except Exception as e:
            self.log_operation_error("initialize_azure_storage", e)
            raise StorageException(
                f"Unexpected error initializing Azure Blob Storage: {str(e)}",
                details={"container": self.container_name}
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
        Upload a PDF document to Azure Blob Storage

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
            self.log_operation_start("upload_document", doc_filename=file.filename)

            # Validate file
            self._validate_file(file)

            # Sanitize filename
            safe_filename = self._sanitize_filename(file.filename)
            if not safe_filename:
                raise InvalidDocumentError("Invalid filename after sanitization")

            # Get blob client
            blob_client = self.container_client.get_blob_client(safe_filename)

            # Check if blob already exists
            if blob_client.exists():
                self.logger.warning(
                    f"Blob already exists, will overwrite: {safe_filename}",
                    extra={"doc_filename": safe_filename}
                )

            # Upload file to Azure Blob Storage
            try:
                file.file.seek(0)  # Reset file pointer to beginning
                blob_client.upload_blob(file.file, overwrite=True)
            except AzureError as e:
                raise StorageException(
                    f"Failed to upload blob to Azure: {str(e)}",
                    details={"filename": safe_filename}
                )

            # Get blob properties
            try:
                blob_properties = blob_client.get_blob_properties()
            except AzureError as e:
                raise StorageException(
                    f"Failed to get blob properties: {str(e)}",
                    details={"filename": safe_filename}
                )

            response = DocumentResponse(
                filename=safe_filename,
                file_path=blob_client.url,  # Azure Blob URL
                size_bytes=blob_properties.size,
                uploaded_at=blob_properties.last_modified
            )

            self.log_operation_success(
                "upload_document",
                doc_filename=safe_filename,
                size_bytes=blob_properties.size
            )

            return response

        except (InvalidDocumentError, DocumentUploadError, StorageException):
            raise
        except Exception as e:
            self.log_operation_error("upload_document", e, doc_filename=file.filename)
            raise DocumentUploadError(
                f"Unexpected error during upload: {str(e)}",
                details={"filename": file.filename}
            )

    def list_documents(self) -> List[DocumentResponse]:
        """
        List all PDF documents in Azure Blob Storage

        Returns:
            List of document responses

        Raises:
            StorageException: If listing fails
        """
        try:
            self.log_operation_start("list_documents")
            documents = []

            # List all blobs in container
            blob_list = self.container_client.list_blobs()

            for blob in blob_list:
                # Only include PDF files
                if blob.name.lower().endswith('.pdf'):
                    try:
                        blob_client = self.container_client.get_blob_client(blob.name)
                        documents.append(
                            DocumentResponse(
                                filename=blob.name,
                                file_path=blob_client.url,  # Azure Blob URL
                                size_bytes=blob.size,
                                uploaded_at=blob.last_modified
                            )
                        )
                    except Exception as e:
                        self.logger.warning(
                            f"Error reading blob properties for {blob.name}: {str(e)}",
                            extra={"doc_filename": blob.name}
                        )
                        continue

            self.log_operation_success("list_documents", count=len(documents))
            return documents

        except AzureError as e:
            self.log_operation_error("list_documents", e)
            raise StorageException(
                f"Failed to list documents from Azure: {str(e)}",
                details={"container": self.container_name}
            )
        except Exception as e:
            self.log_operation_error("list_documents", e)
            raise StorageException(
                f"Failed to list documents: {str(e)}",
                details={"container": self.container_name}
            )

    def delete_document(self, filename: str) -> bool:
        """
        Delete a PDF document from Azure Blob Storage

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

            self.log_operation_start("delete_document", doc_filename=safe_filename)

            # Get blob client
            blob_client = self.container_client.get_blob_client(safe_filename)

            # Check if blob exists
            if not blob_client.exists():
                self.logger.warning(f"Blob not found: {safe_filename}")
                raise DocumentNotFoundError(
                    f"Document {safe_filename} not found",
                    details={"filename": safe_filename}
                )

            # Delete blob
            try:
                blob_client.delete_blob()
            except ResourceNotFoundError:
                raise DocumentNotFoundError(
                    f"Document {safe_filename} not found",
                    details={"filename": safe_filename}
                )
            except AzureError as e:
                raise StorageException(
                    f"Failed to delete blob from Azure: {str(e)}",
                    details={"filename": safe_filename}
                )

            self.log_operation_success("delete_document", doc_filename=safe_filename)
            return True

        except DocumentNotFoundError:
            raise
        except Exception as e:
            self.log_operation_error("delete_document", e, doc_filename=filename)
            raise StorageException(
                f"Unexpected error during deletion: {str(e)}",
                details={"filename": filename}
            )

    def get_document_path(self, filename: str) -> str:
        """
        Download document from Azure and return temporary local path

        Args:
            filename: Document filename

        Returns:
            Local temporary file path for the document

        Raises:
            DocumentNotFoundError: If document doesn't exist
        """
        import tempfile

        safe_filename = self._sanitize_filename(filename)
        blob_client = self.container_client.get_blob_client(safe_filename)

        if not blob_client.exists():
            raise DocumentNotFoundError(
                f"Document {safe_filename} not found",
                details={"filename": safe_filename}
            )

        # Download to temporary file
        try:
            # Create temp directory if it doesn't exist
            temp_dir = Path(tempfile.gettempdir()) / "rag_chatbot_temp"
            temp_dir.mkdir(exist_ok=True)

            temp_file_path = temp_dir / safe_filename

            # Download blob to temp file
            with open(temp_file_path, "wb") as temp_file:
                blob_data = blob_client.download_blob()
                temp_file.write(blob_data.readall())

            self.logger.info(f"Downloaded blob to temporary file: {temp_file_path}")
            return str(temp_file_path)

        except AzureError as e:
            raise StorageException(
                f"Failed to download blob from Azure: {str(e)}",
                details={"filename": safe_filename}
            )

    def get_all_document_paths(self) -> List[str]:
        """
        Download all PDF documents and return their temporary local paths

        Returns:
            List of temporary local document paths

        Raises:
            StorageException: If download fails
        """
        try:
            paths = []
            blob_list = self.container_client.list_blobs()

            for blob in blob_list:
                if blob.name.lower().endswith('.pdf'):
                    try:
                        temp_path = self.get_document_path(blob.name)
                        paths.append(temp_path)
                    except Exception as e:
                        self.logger.warning(
                            f"Error downloading blob {blob.name}: {str(e)}",
                            extra={"doc_filename": blob.name}
                        )
                        continue

            self.logger.info(f"Downloaded {len(paths)} document paths")
            return paths

        except AzureError as e:
            self.log_operation_error("get_all_document_paths", e)
            raise StorageException(
                f"Failed to get document paths from Azure: {str(e)}",
                details={"container": self.container_name}
            )
        except Exception as e:
            self.log_operation_error("get_all_document_paths", e)
            raise StorageException(
                f"Failed to get document paths: {str(e)}",
                details={"container": self.container_name}
            )
