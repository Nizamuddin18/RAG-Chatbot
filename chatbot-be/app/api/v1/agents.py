from fastapi import APIRouter, HTTPException
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

logger = get_logger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])
agent_service = AgentService()
rag_service = RAGService()


@router.post("/", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate):
    """Create a new AI agent"""
    try:
        agent = agent_service.create_agent(agent_data)
        return agent
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")


@router.get("/", response_model=AgentList)
async def list_agents():
    """List all AI agents"""
    try:
        agents = agent_service.list_agents()
        return AgentList(agents=agents, total=len(agents))
    except Exception as e:
        logger.error(f"Error listing agents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing agents: {str(e)}")


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get details of a specific agent"""
    try:
        agent = agent_service.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting agent: {str(e)}")


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent_data: AgentUpdate):
    """Update an existing agent"""
    try:
        agent = agent_service.update_agent(agent_id, agent_data)
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating agent: {str(e)}")


@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_agent(agent_id: str):
    """Delete an agent"""
    try:
        success = agent_service.delete_agent(agent_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        return MessageResponse(
            message=f"Agent {agent_id} deleted successfully",
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting agent: {str(e)}")


@router.post("/execute", response_model=AgentExecuteResponse)
async def execute_agent(request: AgentExecuteRequest):
    """Execute an agent with a user query"""
    try:
        result = rag_service.execute_agent(request.agent_id, request.query)
        return AgentExecuteResponse(**result)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error executing agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error executing agent: {str(e)}")
