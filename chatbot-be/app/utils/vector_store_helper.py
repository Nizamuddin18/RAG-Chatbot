from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from typing import List, Optional, Dict, Any
from langchain_core.documents import Document
from app.core.logger import get_logger
from app.core.config import get_settings
from app.utils.embedding_helper import EmbeddingHelper
import os
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
            logger.info(f"Found {len(index_names)} indexes")
            return index_names
        except Exception as e:
            logger.error(f"Error listing indexes: {str(e)}")
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

    def get_retriever(self, index_name: str, k: int = 3):
        """Get a retriever for an index"""
        vector_store = self.get_vector_store(index_name)
        if vector_store is None:
            raise ValueError(f"Index {index_name} does not exist")

        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )
