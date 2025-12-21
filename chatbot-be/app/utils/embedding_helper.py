from langchain_huggingface import HuggingFaceEmbeddings
from app.core.logger import get_logger
from app.core.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


class EmbeddingHelper:
    """Utility class for handling embeddings"""

    _instance = None
    _embeddings = None

    def __new__(cls):
        """Singleton pattern to reuse embeddings model"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_embeddings(self, model_name: str = None) -> HuggingFaceEmbeddings:
        """Get or create embeddings model instance"""
        if self._embeddings is None:
            model = model_name or settings.EMBEDDING_MODEL
            logger.info(f"Loading embedding model: {model}")
            self._embeddings = HuggingFaceEmbeddings(model_name=model)
            logger.info("Embedding model loaded successfully")
        return self._embeddings

    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embedding vectors"""
        embeddings = self.get_embeddings()
        test_vector = embeddings.embed_query("test")
        dimension = len(test_vector)
        logger.info(f"Embedding dimension: {dimension}")
        return dimension
