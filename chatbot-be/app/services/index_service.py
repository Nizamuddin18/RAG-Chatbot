from typing import List, Optional
from app.core.logger import get_logger
from app.utils.vector_store_helper import VectorStoreHelper
from app.utils.pdf_processor import PDFProcessor
from app.models.schemas import IndexInfo, IndexCreate

logger = get_logger(__name__)


class IndexService:
    """Service for managing Pinecone indexes"""

    def __init__(self):
        self.vector_store_helper = VectorStoreHelper()
        self.pdf_processor = PDFProcessor()

    def list_indexes(self) -> List[IndexInfo]:
        """List all available indexes"""
        try:
            logger.info("Listing all indexes")
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
                    logger.warning(f"Error getting info for index {name}: {str(e)}")

            logger.info(f"Found {len(indexes)} indexes")
            return indexes
        except Exception as e:
            logger.error(f"Error listing indexes: {str(e)}")
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
        """Update an index with all documents from a directory"""
        try:
            logger.info(f"Updating index {index_name} from directory: {directory_path}")

            # Process all PDFs in directory
            chunks = self.pdf_processor.process_directory(directory_path)
            logger.info(f"Processed {len(chunks)} chunks from directory")

            # Add to vector store
            self.vector_store_helper.add_documents_to_index(index_name, chunks)

            logger.info(f"Index {index_name} updated successfully")
            return self.get_index_details(index_name)
        except Exception as e:
            logger.error(f"Error updating index {index_name} from directory: {str(e)}")
            raise
