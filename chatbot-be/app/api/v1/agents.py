"""
Agents API endpoints with streaming support and comprehensive error handling
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentList,
    AgentExecuteRequest,
    AgentExecuteResponse,
    MessageResponse
)
from app.services.agent_service import AgentService
from app.services.rag_service import RAGService
from app.core.logger import get_logger
from app.core.exceptions import (
    AgentNotFoundError,
    AgentExecutionError,
    AgentConfigurationError
)

logger = get_logger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])
agent_service = AgentService()
rag_service = RAGService(agent_service=agent_service)  # Share the same agent_service instance


@router.post("/", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate):
    """
    Create a new AI agent

    Args:
        agent_data: Agent configuration

    Returns:
        Created agent details

    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    try:
        logger.info(f"Creating agent: {agent_data.name}")
        agent = agent_service.create_agent(agent_data)
        logger.info(f"Agent created successfully: {agent.agent_id}")
        return agent
    except AgentConfigurationError as e:
        logger.warning(f"Agent configuration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error creating agent: {str(e)}"
        )


@router.get("/", response_model=AgentList)
async def list_agents():
    """
    List all AI agents

    Returns:
        List of all agents with total count

    Raises:
        HTTPException: 500 for server errors
    """
    try:
        agents = agent_service.list_agents()
        logger.info(f"Listed {len(agents)} agents")
        return AgentList(agents=agents, total=len(agents))
    except Exception as e:
        logger.error(f"Error listing agents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error listing agents: {str(e)}"
        )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """
    Get details of a specific agent

    Args:
        agent_id: Agent identifier

    Returns:
        Agent details

    Raises:
        HTTPException: 404 if agent not found, 500 for server errors
    """
    try:
        logger.info(f"Fetching agent: {agent_id}")
        agent = agent_service.get_agent(agent_id)
        if not agent:
            logger.warning(f"Agent not found: {agent_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Agent {agent_id} not found"
            )
        return agent
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting agent: {str(e)}"
        )


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent_data: AgentUpdate):
    """
    Update an existing agent

    Args:
        agent_id: Agent identifier
        agent_data: Updated agent configuration

    Returns:
        Updated agent details

    Raises:
        HTTPException: 404 if agent not found, 500 for server errors
    """
    try:
        logger.info(f"Updating agent: {agent_id}")
        agent = agent_service.update_agent(agent_id, agent_data)
        if not agent:
            logger.warning(f"Agent not found for update: {agent_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Agent {agent_id} not found"
            )
        logger.info(f"Agent updated successfully: {agent_id}")
        return agent
    except HTTPException:
        raise
    except AgentConfigurationError as e:
        logger.warning(f"Agent configuration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating agent: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error updating agent: {str(e)}"
        )


@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_agent(agent_id: str):
    """
    Delete an agent

    Args:
        agent_id: Agent identifier

    Returns:
        Success message

    Raises:
        HTTPException: 404 if agent not found, 500 for server errors
    """
    try:
        logger.info(f"Deleting agent: {agent_id}")
        success = agent_service.delete_agent(agent_id)
        if not success:
            logger.warning(f"Agent not found for deletion: {agent_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Agent {agent_id} not found"
            )

        logger.info(f"Agent deleted successfully: {agent_id}")
        return MessageResponse(
            message=f"Agent {agent_id} deleted successfully",
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting agent: {str(e)}"
        )


@router.post("/execute", response_model=AgentExecuteResponse)
async def execute_agent(request: AgentExecuteRequest):
    """
    Execute an agent with a user query (non-streaming)

    Args:
        request: Agent execution request with agent_id and query

    Returns:
        Agent response with answer, context documents, and metrics

    Raises:
        HTTPException: 404 if agent not found, 500 for execution errors
    """
    try:
        logger.info(
            f"Executing agent: {request.agent_id}",
            extra={"agent_id": request.agent_id, "query_length": len(request.query)}
        )
        result = rag_service.execute_agent(request.agent_id, request.query)
        logger.info(
            f"Agent execution completed: {request.agent_id}",
            extra={"execution_time_ms": result.get("execution_time_ms")}
        )
        return AgentExecuteResponse(**result)
    except AgentNotFoundError as e:
        logger.warning(f"Agent not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except AgentExecutionError as e:
        logger.error(f"Agent execution error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error executing agent: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error executing agent: {str(e)}"
        )


@router.post("/execute/stream")
async def execute_agent_stream(request: AgentExecuteRequest):
    """
    Execute an agent with streaming response (Server-Sent Events)

    This endpoint returns a stream of events as the AI generates the response,
    allowing for real-time display in the UI.

    Event types:
    - metadata: Initial agent and configuration info
    - context: Retrieved context documents (RAG only)
    - content: Chunks of the generated answer
    - done: Completion with execution metrics
    - error: Error information if execution fails

    Args:
        request: Agent execution request with agent_id and query

    Returns:
        StreamingResponse with Server-Sent Events

    Example event format:
        data: {"type": "metadata", "agent_id": "...", "agent_name": "..."}
        data: {"type": "content", "content": "Hello"}
        data: {"type": "done", "execution_time_ms": 1234.5}
    """
    try:
        logger.info(
            f"Starting streaming execution for agent: {request.agent_id}",
            extra={"agent_id": request.agent_id, "query_length": len(request.query)}
        )

        return StreamingResponse(
            rag_service.execute_agent_stream(request.agent_id, request.query),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    except Exception as e:
        logger.error(f"Error in streaming setup: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error starting stream: {str(e)}"
        )
