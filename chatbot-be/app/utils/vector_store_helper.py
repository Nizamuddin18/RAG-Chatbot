from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from typing import List, Optional, Dict, Any
from langchain_core.documents import Document
from app.core.logger import get_logger
from app.core.config import get_settings
from app.utils.embedding_helper import EmbeddingHelper
import os
import random
load_dotenv()
logger = get_logger(__name__)
settings = get_settings()


class VectorStoreHelper:
    """Utility class for managing Pinecone vector stores"""

    def __init__(self):
        self.pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.embedding_helper = EmbeddingHelper()

    def list_indexes(self) -> List[str]:
        """List all Pinecone indexes"""
        try:
            indexes = self.pinecone_client.list_indexes()
            index_names = [index.name for index in indexes]
            logger.debug(f"[Pinecone] Retrieved {len(index_names)} index names: {index_names}")
            return index_names
        except Exception as e:
            logger.error(f"[Pinecone] Error listing indexes: {str(e)}")
            raise

    def get_index_info(self, index_name: str) -> Dict[str, Any]:
        """Get information about a specific index"""
        try:
            index = self.pinecone_client.Index(index_name)
            stats = index.describe_index_stats()
            logger.info(f"Retrieved info for index: {index_name}")
            return {
                "name": index_name,
                "dimension": stats.dimension,
                "total_vector_count": stats.total_vector_count,
                "namespaces": stats.namespaces
            }
        except Exception as e:
            logger.error(f"Error getting index info for {index_name}: {str(e)}")
            raise

    def create_index(
        self,
        index_name: str,
        dimension: Optional[int] = None,
        metric: str = "cosine"
    ) -> None:
        """Create a new Pinecone index"""
        try:
            if index_name in self.list_indexes():
                logger.warning(f"Index {index_name} already exists")
                return

            if dimension is None:
                dimension = self.embedding_helper.get_embedding_dimension()

            logger.info(f"Creating index: {index_name} with dimension: {dimension}")
            self.pinecone_client.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud="aws",
                    region=settings.PINECONE_ENVIRONMENT
                )
            )
            logger.info(f"Index {index_name} created successfully")
        except Exception as e:
            logger.error(f"Error creating index {index_name}: {str(e)}")
            raise

    def delete_index(self, index_name: str) -> None:
        """Delete a Pinecone index"""
        try:
            logger.info(f"Deleting index: {index_name}")
            self.pinecone_client.delete_index(index_name)
            logger.info(f"Index {index_name} deleted successfully")
        except Exception as e:
            logger.error(f"Error deleting index {index_name}: {str(e)}")
            raise

    def add_documents_to_index(
        self,
        index_name: str,
        documents: List[Document]
    ) -> PineconeVectorStore:
        """Add documents to an existing index"""
        try:
            logger.info(f"Adding {len(documents)} documents to index: {index_name}")

            # Ensure index exists
            index_created = False
            if index_name not in self.list_indexes():
                logger.info(f"Index {index_name} doesn't exist, creating it")
                self.create_index(index_name)
                index_created = True

            # If index was just created, wait for it to be ready
            if index_created:
                import time
                logger.info("Waiting for index to be ready...")
                time.sleep(5)

            embeddings = self.embedding_helper.get_embeddings()

            logger.info(f"Creating vector store for index: {index_name}")

            # Add documents to vector store using index_name as string
            # Note: PINECONE_API_KEY must be in environment for this to work
            vector_store = PineconeVectorStore.from_documents(
                documents=documents,
                embedding=embeddings,
                index_name=index_name
            )

            logger.info(f"Successfully added documents to index: {index_name}")
            return vector_store
        except Exception as e:
            logger.error(f"Error adding documents to index {index_name}: {str(e)}")
            raise

    def get_vector_store(self, index_name: str) -> Optional[PineconeVectorStore]:
        """Get a vector store for an existing index"""
        try:
            if index_name not in self.list_indexes():
                logger.warning(f"Index {index_name} does not exist")
                return None

            embeddings = self.embedding_helper.get_embeddings()

            # Create vector store using index_name as string
            vector_store = PineconeVectorStore(
                index_name=index_name,
                embedding=embeddings
            )
            logger.info(f"Retrieved vector store for index: {index_name}")
            return vector_store
        except Exception as e:
            logger.error(f"Error getting vector store for {index_name}: {str(e)}")
            raise

    def check_document_in_index(self, index_name: str, file_path: str) -> bool:
        """
        Check if a document exists in an index by comparing filenames from metadata.

        This method extracts the filename from the provided file_path and queries
        Pinecone to find vectors with matching filenames in their 'source' metadata.

        Args:
            index_name: Name of the Pinecone index to check
            file_path: File path or URL of the document (will extract filename)

        Returns:
            True if document exists in index, False otherwise
        """
        try:
            if index_name not in self.list_indexes():
                logger.warning(f"Index '{index_name}' not found in available indexes")
                return False

            # Extract filename from path/URL
            # Examples:
            # - Azure Blob: https://.../container/filename.pdf -> filename.pdf
            # - Local: /tmp/xyz/filename.pdf -> filename.pdf
            # - Windows: C:\path\filename.pdf -> filename.pdf
            if '/' in file_path:
                filename = file_path.split('/')[-1]
            elif '\\' in file_path:
                filename = file_path.split('\\')[-1]
            else:
                filename = file_path

            # Normalize filename for comparison (handle case sensitivity and whitespace)
            filename_normalized = filename.strip().lower()

            logger.info(f"[Index Check] Searching for '{filename}' in index '{index_name}'")

            index = self.pinecone_client.Index(index_name)

            # Get index statistics
            index_info = self.get_index_info(index_name)
            dimension = index_info['dimension']
            total_vectors = index_info['total_vector_count']

            logger.debug(f"[Index Check] Index stats: dimension={dimension}, vectors={total_vectors}")

            # Check if index is empty
            if total_vectors == 0:
                logger.warning(f"[Index Check] Index '{index_name}' is empty (0 vectors)")
                return False

            # Generate a small random query vector (non-zero for reliable results)
            random.seed(42)  # Consistent results across calls
            query_vector = [random.uniform(0.1, 0.2) for _ in range(dimension)]

            # Query strategy: Fetch vectors and check source metadata
            # Pinecone stores full paths like: /var/folders/.../rag_chatbot_temp/file.pdf
            # We extract the filename and compare it with our search filename

            # Determine how many vectors to fetch
            # Fetch enough to have high confidence, but cap at 1000 for performance
            fetch_count = min(1000, total_vectors)

            logger.debug(f"[Index Check] Fetching {fetch_count} vectors to check source metadata")

            query_response = index.query(
                vector=query_vector,
                top_k=fetch_count,
                include_metadata=True
            )

            vectors_checked = len(query_response.matches)
            logger.debug(f"[Index Check] Retrieved {vectors_checked} vectors from index")

            # Track unique documents found in index (for debugging)
            unique_documents = set()
            found_match = False

            # Check each vector's source metadata
            for i, match in enumerate(query_response.matches):
                if 'source' not in match.metadata:
                    if i < 3:  # Log first few missing sources only
                        logger.warning(f"[Index Check] Vector {i} missing 'source' field in metadata")
                    continue

                source = match.metadata['source']

                # Extract filename from the source path
                # Handle Unix (/), Windows (\), and bare filenames
                if '/' in source:
                    source_filename = source.split('/')[-1]
                elif '\\' in source:
                    source_filename = source.split('\\')[-1]
                else:
                    source_filename = source

                # Normalize for comparison
                source_filename_normalized = source_filename.strip().lower()

                # Track unique documents
                unique_documents.add(source_filename)

                # Log first few sources for debugging
                if i < 3:
                    logger.debug(f"[Index Check] Vector {i}: source='{source}' -> filename='{source_filename}'")

                # Compare normalized filenames (case-insensitive, whitespace-trimmed)
                if source_filename_normalized == filename_normalized:
                    logger.info(f"[Index Check] ✓ Match found: '{source_filename}' == '{filename}'")
                    found_match = True
                    break

            # Log results
            if found_match:
                logger.info(f"[Index Check] Document '{filename}' found in index '{index_name}'")
                return True
            else:
                logger.info(f"[Index Check] ✗ Document '{filename}' NOT found in index '{index_name}'")
                logger.info(f"[Index Check] Checked {vectors_checked} vectors from index")

                # Show what documents ARE in the index (for debugging)
                if unique_documents:
                    unique_list = sorted(unique_documents)[:10]  # Show first 10
                    logger.debug(f"[Index Check] Documents in index (first 10): {unique_list}")
                    if len(unique_documents) > 10:
                        logger.debug(f"[Index Check] ... and {len(unique_documents) - 10} more documents")

                return False

        except Exception as e:
            logger.error(f"[Index Check] Error checking document '{file_path}' in index '{index_name}': {str(e)}", exc_info=True)
            return False

    def get_retriever(self, index_name: str, k: int = 3):
        """Get a retriever for an index"""
        vector_store = self.get_vector_store(index_name)
        if vector_store is None:
            raise ValueError(f"Index {index_name} does not exist")

        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )
