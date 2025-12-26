"""
RAG Service with streaming support and comprehensive error handling
"""
import time
import json
from typing import Dict, Any, Optional, AsyncIterator
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from app.core.logger import get_logger, LoggerMixin
from app.core.config import get_settings
from app.core.exceptions import (
    AgentNotFoundError,
    AgentExecutionError,
    AzureOpenAIError,
    IndexNotFoundError
)
from app.utils.vector_store_helper import VectorStoreHelper
from app.services.agent_service import AgentService

logger = get_logger(__name__)
settings = get_settings()


class RAGService(LoggerMixin):
    """Service for handling RAG (Retrieval-Augmented Generation) operations"""

    def __init__(self, agent_service: Optional[AgentService] = None):
        self.vector_store_helper = VectorStoreHelper()
        self.agent_service = agent_service if agent_service else AgentService()
        self._chat_model = None

    def _get_chat_model(
        self,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        streaming: bool = False
    ) -> AzureChatOpenAI:
        """
        Get or create Azure Chat model

        Args:
            temperature: Model temperature (0.0 to 2.0)
            max_tokens: Maximum tokens in response
            streaming: Enable streaming mode

        Returns:
            Configured AzureChatOpenAI instance
        """
        try:
            return AzureChatOpenAI(
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                deployment_name=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=temperature,
                max_tokens=max_tokens,
                streaming=streaming
            )
        except Exception as e:
            self.log_operation_error("create_chat_model", e)
            raise AzureOpenAIError(
                "Failed to initialize Azure OpenAI client",
                details={"error": str(e)}
            )

    def execute_agent(self, agent_id: str, query: str) -> Dict[str, Any]:
        """
        Execute an agent with a user query (non-streaming)

        Args:
            agent_id: Agent identifier
            query: User query

        Returns:
            Dict containing answer, context, and metadata

        Raises:
            AgentNotFoundError: If agent doesn't exist
            AgentExecutionError: If execution fails
        """
        try:
            start_time = time.time()
            self.log_operation_start(
                "execute_agent",
                agent_id=agent_id,
                query_length=len(query)
            )

            # Get agent configuration
            agent = self.agent_service.get_agent(agent_id)
            if not agent:
                raise AgentNotFoundError(
                    f"Agent {agent_id} not found",
                    details={"agent_id": agent_id}
                )

            # Create chat model with agent settings
            chat_model = self._get_chat_model(
                temperature=agent.temperature,
                max_tokens=agent.max_tokens,
                streaming=False
            )

            # Execute with or without RAG
            if agent.index_name:
                self.logger.info(
                    f"Using RAG with index: {agent.index_name}",
                    extra={"agent_id": agent_id, "index_name": agent.index_name}
                )
                result = self._execute_with_rag(
                    chat_model=chat_model,
                    system_instruction=agent.system_instruction,
                    index_name=agent.index_name,
                    query=query
                )
            else:
                self.logger.info(
                    "Executing without RAG (no index attached)",
                    extra={"agent_id": agent_id}
                )
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

            self.log_operation_success(
                "execute_agent",
                duration_ms=execution_time,
                agent_id=agent_id,
                response_length=len(response["answer"])
            )

            return response

        except AgentNotFoundError:
            raise
        except Exception as e:
            self.log_operation_error("execute_agent", e, agent_id=agent_id)
            raise AgentExecutionError(
                f"Failed to execute agent: {str(e)}",
                details={"agent_id": agent_id, "error": str(e)}
            )

    async def execute_agent_stream(
        self,
        agent_id: str,
        query: str
    ) -> AsyncIterator[str]:
        """
        Execute an agent with streaming response

        Args:
            agent_id: Agent identifier
            query: User query

        Yields:
            Server-Sent Events formatted strings

        Raises:
            AgentNotFoundError: If agent doesn't exist
            AgentExecutionError: If execution fails
        """
        try:
            start_time = time.time()
            self.log_operation_start(
                "execute_agent_stream",
                agent_id=agent_id,
                query_length=len(query)
            )

            # Get agent configuration
            agent = self.agent_service.get_agent(agent_id)
            if not agent:
                error_data = {
                    "error": f"Agent {agent_id} not found",
                    "agent_id": agent_id
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                return

            # Create chat model with streaming enabled
            chat_model = self._get_chat_model(
                temperature=agent.temperature,
                max_tokens=agent.max_tokens,
                streaming=True
            )

            # Send metadata first
            metadata = {
                "type": "metadata",
                "agent_id": agent_id,
                "agent_name": agent.name,
                "has_rag": bool(agent.index_name)
            }
            yield f"data: {json.dumps(metadata)}\n\n"

            # Execute with or without RAG (streaming)
            if agent.index_name:
                self.logger.info(
                    f"Using RAG with streaming for index: {agent.index_name}",
                    extra={"agent_id": agent_id, "index_name": agent.index_name}
                )

                async for chunk in self._execute_with_rag_stream(
                    chat_model=chat_model,
                    system_instruction=agent.system_instruction,
                    index_name=agent.index_name,
                    query=query
                ):
                    yield chunk

            else:
                self.logger.info(
                    "Executing without RAG (streaming)",
                    extra={"agent_id": agent_id}
                )

                async for chunk in self._execute_without_rag_stream(
                    chat_model=chat_model,
                    system_instruction=agent.system_instruction,
                    query=query
                ):
                    yield chunk

            # Send completion event
            execution_time = (time.time() - start_time) * 1000
            completion = {
                "type": "done",
                "execution_time_ms": execution_time
            }
            yield f"data: {json.dumps(completion)}\n\n"

            self.log_operation_success(
                "execute_agent_stream",
                duration_ms=execution_time,
                agent_id=agent_id
            )

        except Exception as e:
            self.log_operation_error("execute_agent_stream", e, agent_id=agent_id)
            error_data = {
                "type": "error",
                "error": str(e),
                "agent_id": agent_id
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    def _execute_with_rag(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        index_name: str,
        query: str
    ) -> Dict[str, Any]:
        """Execute agent with RAG using vector store retrieval (non-streaming)"""
        try:
            # Get retriever
            retriever = self.vector_store_helper.get_retriever(index_name, k=3)
            if not retriever:
                raise IndexNotFoundError(
                    f"Index {index_name} not found",
                    details={"index_name": index_name}
                )

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

        except IndexNotFoundError:
            raise
        except Exception as e:
            self.logger.error(
                f"Error in RAG execution: {str(e)}",
                extra={"index_name": index_name},
                exc_info=True
            )
            raise AgentExecutionError(
                f"RAG execution failed: {str(e)}",
                details={"index_name": index_name, "error": str(e)}
            )

    async def _execute_with_rag_stream(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        index_name: str,
        query: str
    ) -> AsyncIterator[str]:
        """Execute agent with RAG using streaming (same business logic as non-streaming)"""
        try:
            # Get retriever (SAME AS NON-STREAMING)
            retriever = self.vector_store_helper.get_retriever(index_name, k=3)
            if not retriever:
                raise IndexNotFoundError(f"Index {index_name} not found")

            # Create prompt with context placeholder (SAME AS NON-STREAMING)
            system_prompt = f"""{system_instruction}

Context: {{context}}
"""
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("user", "{input}")
            ])

            # Create RAG chain (SAME AS NON-STREAMING)
            question_answer_chain = create_stuff_documents_chain(chat_model, prompt)
            rag_chain = create_retrieval_chain(retriever, question_answer_chain)

            # Stream response (only difference: astream vs invoke)
            context_sent = False
            async for chunk in rag_chain.astream({"input": query}):
                # Send context documents event (once)
                if not context_sent and "context" in chunk:
                    context_docs = []
                    for doc in chunk["context"]:
                        context_docs.append({
                            "content": doc.page_content,
                            "metadata": doc.metadata
                        })

                    context_event = {
                        "type": "context",
                        "documents": context_docs
                    }
                    yield f"data: {json.dumps(context_event)}\n\n"
                    context_sent = True

                # Send content chunks
                if "answer" in chunk:
                    content = chunk["answer"]
                    if content:
                        chunk_data = {
                            "type": "content",
                            "content": content
                        }
                        yield f"data: {json.dumps(chunk_data)}\n\n"

        except Exception as e:
            self.logger.error(f"Error in RAG streaming: {str(e)}", exc_info=True)
            raise

    def _execute_without_rag(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        query: str
    ) -> Dict[str, Any]:
        """Execute agent without RAG (direct chat, non-streaming)"""
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
            self.logger.error(f"Error in direct chat execution: {str(e)}", exc_info=True)
            raise AgentExecutionError(
                f"Chat execution failed: {str(e)}",
                details={"error": str(e)}
            )

    async def _execute_without_rag_stream(
        self,
        chat_model: AzureChatOpenAI,
        system_instruction: str,
        query: str
    ) -> AsyncIterator[str]:
        """Execute agent without RAG using streaming"""
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_instruction),
                ("user", "{input}")
            ])

            chain = prompt | chat_model

            # Stream response
            async for chunk in chain.astream({"input": query}):
                if chunk.content:
                    chunk_data = {
                        "type": "content",
                        "content": chunk.content
                    }
                    yield f"data: {json.dumps(chunk_data)}\n\n"

        except Exception as e:
            self.logger.error(f"Error in direct chat streaming: {str(e)}", exc_info=True)
            raise
