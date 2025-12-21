import time
from typing import Dict, Any, Optional
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from app.core.logger import get_logger
from app.core.config import get_settings
from app.utils.vector_store_helper import VectorStoreHelper
from app.services.agent_service import AgentService

logger = get_logger(__name__)
settings = get_settings()


class RAGService:
    """Service for handling RAG (Retrieval-Augmented Generation) operations"""

    def __init__(self):
        self.vector_store_helper = VectorStoreHelper()
        self.agent_service = AgentService()
        self._chat_model = None

    def _get_chat_model(self, temperature: float = 0.7, max_tokens: Optional[int] = None) -> AzureChatOpenAI:
        """Get or create Azure Chat model"""
        return AzureChatOpenAI(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            deployment_name=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            temperature=temperature,
            max_tokens=max_tokens
        )

    def execute_agent(self, agent_id: str, query: str) -> Dict[str, Any]:
        """Execute an agent with a user query"""
        try:
            start_time = time.time()
            logger.info(f"Executing agent {agent_id} with query: {query[:50]}...")

            # Get agent configuration
            agent = self.agent_service.get_agent(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} not found")

            # Create chat model with agent settings
            chat_model = self._get_chat_model(
                temperature=agent.temperature,
                max_tokens=agent.max_tokens
            )

            # If agent has an index, use RAG
            if agent.index_name:
                logger.info(f"Using RAG with index: {agent.index_name}")
                result = self._execute_with_rag(
                    chat_model=chat_model,
                    system_instruction=agent.system_instruction,
                    index_name=agent.index_name,
                    query=query
                )
            else:
                logger.info("Executing without RAG (no index attached)")
                result = self._execute_without_rag(
                    chat_model=chat_model,
                    system_instruction=agent.system_instruction,
                    query=query
                )

            execution_time = (time.time() - start_time) * 1000  # Convert to ms

            response = {
                "agent_id": agent_id,
                "query": query,
                "answer": result.get("answer", result.get("content", "")),
                "context_documents": result.get("context", None),
                "execution_time_ms": execution_time
            }

            logger.info(f"Agent execution completed in {execution_time:.2f}ms")
            return response
        except Exception as e:
            logger.error(f"Error executing agent {agent_id}: {str(e)}")
            raise

    def _execute_with_rag(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        index_name: str,
        query: str
    ) -> Dict[str, Any]:
        """Execute agent with RAG using vector store retrieval"""
        try:
            # Get retriever
            retriever = self.vector_store_helper.get_retriever(index_name, k=3)

            # Create prompt with context
            system_prompt = f"""{system_instruction}

Context: {{context}}
"""
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("user", "{input}")
            ])

            # Create RAG chain
            question_answer_chain = create_stuff_documents_chain(chat_model, prompt)
            rag_chain = create_retrieval_chain(retriever, question_answer_chain)

            # Execute
            response = rag_chain.invoke({"input": query})

            # Extract context documents
            context_docs = []
            if "context" in response:
                for doc in response["context"]:
                    context_docs.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    })

            return {
                "answer": response.get("answer", ""),
                "context": context_docs
            }
        except Exception as e:
            logger.error(f"Error in RAG execution: {str(e)}")
            raise

    def _execute_without_rag(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        query: str
    ) -> Dict[str, Any]:
        """Execute agent without RAG (direct chat)"""
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_instruction),
                ("user", "{input}")
            ])

            chain = prompt | chat_model
            response = chain.invoke({"input": query})

            return {
                "answer": response.content,
                "context": None
            }
        except Exception as e:
            logger.error(f"Error in direct chat execution: {str(e)}")
            raise
