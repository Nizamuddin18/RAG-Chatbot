from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from langchain_core.documents import Document
from app.core.logger import get_logger
from app.core.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


class PDFProcessor:
    """Utility class for processing PDF documents"""

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

    def load_pdf(self, file_path: str) -> List[Document]:
        """Load a single PDF file"""
        try:
            logger.info(f"Loading PDF from: {file_path}")
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded {len(documents)} pages from {file_path}")
            return documents
        except Exception as e:
            logger.error(f"Error loading PDF {file_path}: {str(e)}")
            raise

    def load_directory(self, directory_path: str, glob_pattern: str = "*.pdf") -> List[Document]:
        """Load all PDF files from a directory"""
        try:
            logger.info(f"Loading PDFs from directory: {directory_path}")
            loader = DirectoryLoader(
                directory_path,
                glob=glob_pattern,
                loader_cls=PyPDFLoader
            )
            documents = loader.load()
            logger.info(f"Loaded {len(documents)} total pages from directory")
            return documents
        except Exception as e:
            logger.error(f"Error loading directory {directory_path}: {str(e)}")
            raise

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks"""
        try:
            logger.info(f"Splitting {len(documents)} documents into chunks")
            chunks = self.text_splitter.split_documents(documents)
            logger.info(f"Created {len(chunks)} text chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error splitting documents: {str(e)}")
            raise

    def process_pdf(self, file_path: str) -> List[Document]:
        """Load and split a single PDF"""
        documents = self.load_pdf(file_path)
        return self.split_documents(documents)

    def process_directory(self, directory_path: str) -> List[Document]:
        """Load and split all PDFs from a directory"""
        documents = self.load_directory(directory_path)
        return self.split_documents(documents)
