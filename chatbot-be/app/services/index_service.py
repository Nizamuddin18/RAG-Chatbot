from typing import List, Optional
from app.core.logger import get_logger
from app.utils.vector_store_helper import VectorStoreHelper
from app.utils.pdf_processor import PDFProcessor
from app.services.document_service import DocumentService
from app.models.schemas import IndexInfo, IndexCreate

logger = get_logger(__name__)


class IndexService:
    """Service for managing Pinecone indexes"""

    def __init__(self):
        self.vector_store_helper = VectorStoreHelper()
        self.pdf_processor = PDFProcessor()
        self.document_service = DocumentService()

    def get_indexes_containing_document(self, file_path: str) -> List[str]:
        """
        Get list of index names that contain the specified document

        Args:
            file_path: File path or URL of the document to search for

        Returns:
            List of index names containing the document
        """
        try:
            # Extract filename for cleaner logging
            if '/' in file_path:
                filename = file_path.split('/')[-1]
            elif '\\' in file_path:
                filename = file_path.split('\\')[-1]
            else:
                filename = file_path

            logger.info(f"[Document Check] Checking which indexes contain: '{filename}'")
            index_names = self.vector_store_helper.list_indexes()
            containing_indexes = []

            for index_name in index_names:
                try:
                    if self.vector_store_helper.check_document_in_index(index_name, file_path):
                        containing_indexes.append(index_name)
                        logger.info(f"[Document Check] ✓ Found in index: '{index_name}'")
                except Exception as e:
                    logger.warning(f"[Document Check] Error checking index '{index_name}': {str(e)}")
                    continue

            if containing_indexes:
                logger.info(f"[Document Check] Result: '{filename}' found in {len(containing_indexes)} index(es): {containing_indexes}")
            else:
                logger.info(f"[Document Check] Result: '{filename}' not found in any indexes")

            return containing_indexes
        except Exception as e:
            logger.error(f"[Document Check] Error getting indexes for document: {str(e)}")
            return []  # Return empty list on error instead of raising

    def list_indexes(self) -> List[IndexInfo]:
        """List all available indexes with their details"""
        try:
            logger.info("[Index Service] Fetching all indexes")
            index_names = self.vector_store_helper.list_indexes()

            indexes = []
            for name in index_names:
                try:
                    info = self.vector_store_helper.get_index_info(name)
                    indexes.append(
                        IndexInfo(
                            name=info["name"],
                            dimension=info["dimension"],
                            metric="cosine",
                            total_vector_count=info["total_vector_count"],
                            status="ready"
                        )
                    )
                except Exception as e:
                    logger.warning(f"[Index Service] Error getting details for index '{name}': {str(e)}")

            logger.info(f"[Index Service] Successfully retrieved {len(indexes)} indexes with details")
            return indexes
        except Exception as e:
            logger.error(f"[Index Service] Error listing indexes: {str(e)}")
            raise

    def get_index_details(self, index_name: str) -> Optional[IndexInfo]:
        """Get details of a specific index"""
        try:
            logger.info(f"Getting details for index: {index_name}")
            info = self.vector_store_helper.get_index_info(index_name)

            return IndexInfo(
                name=info["name"],
                dimension=info["dimension"],
                metric="cosine",
                total_vector_count=info["total_vector_count"],
                status="ready"
            )
        except Exception as e:
            logger.error(f"Error getting index details for {index_name}: {str(e)}")
            raise

    def create_index(self, index_data: IndexCreate) -> IndexInfo:
        """Create a new index"""
        try:
            logger.info(f"Creating index: {index_data.index_name}")
            self.vector_store_helper.create_index(
                index_name=index_data.index_name,
                dimension=index_data.dimension,
                metric=index_data.metric
            )

            # Return the created index info
            return self.get_index_details(index_data.index_name)
        except Exception as e:
            logger.error(f"Error creating index {index_data.index_name}: {str(e)}")
            raise

    def delete_index(self, index_name: str) -> bool:
        """Delete an index"""
        try:
            logger.info(f"Deleting index: {index_name}")
            self.vector_store_helper.delete_index(index_name)
            logger.info(f"Index deleted successfully: {index_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting index {index_name}: {str(e)}")
            raise

    def update_index_with_documents(
        self,
        index_name: str,
        document_paths: List[str]
    ) -> IndexInfo:
        """Update an index with new documents"""
        try:
            logger.info(f"Updating index {index_name} with {len(document_paths)} documents")

            # Process all documents
            all_chunks = []
            for doc_path in document_paths:
                # Check if this is an Azure Blob URL
                if doc_path.startswith('https://') and 'blob.core.windows.net' in doc_path:
                    # Extract filename from URL
                    # URL format: https://account.blob.core.windows.net/container/filename
                    filename = doc_path.split('/')[-1]
                    logger.info(f"Downloading Azure blob: {filename}")

                    # Download to temporary file
                    local_path = self.document_service.get_document_path(filename)
                    logger.info(f"Processing downloaded file: {local_path}")
                    chunks = self.pdf_processor.process_pdf(local_path)
                else:
                    # Local file path
                    chunks = self.pdf_processor.process_pdf(doc_path)

                all_chunks.extend(chunks)

            logger.info(f"Processed {len(all_chunks)} chunks from documents")

            # Add to vector store
            self.vector_store_helper.add_documents_to_index(index_name, all_chunks)

            logger.info(f"Index {index_name} updated successfully")
            return self.get_index_details(index_name)
        except Exception as e:
            logger.error(f"Error updating index {index_name}: {str(e)}")
            raise

    def update_index_with_directory(self, index_name: str, directory_path: str) -> IndexInfo:
        """Update an index with all documents from Azure Blob Storage"""
        try:
            logger.info(f"Updating index {index_name} from all documents in Azure Blob Storage")

            # Get all document paths from Azure (downloads to temp directory)
            local_paths = self.document_service.get_all_document_paths()
            logger.info(f"Downloaded {len(local_paths)} documents from Azure")

            # Process all documents
            all_chunks = []
            for local_path in local_paths:
                try:
                    chunks = self.pdf_processor.process_pdf(local_path)
                    all_chunks.extend(chunks)
                except Exception as e:
                    logger.warning(f"Error processing {local_path}: {str(e)}")
                    continue

            logger.info(f"Processed {len(all_chunks)} chunks from all documents")

            # Add to vector store
            self.vector_store_helper.add_documents_to_index(index_name, all_chunks)

            logger.info(f"Index {index_name} updated successfully")
            return self.get_index_details(index_name)
        except Exception as e:
            logger.error(f"Error updating index {index_name} from directory: {str(e)}")
            raise
