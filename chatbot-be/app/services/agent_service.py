import json
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
from app.core.logger import get_logger
from app.models.schemas import AgentCreate, AgentUpdate, AgentResponse

logger = get_logger(__name__)


class AgentService:
    """Service for managing AI agents"""

    def __init__(self):
        self.agents_file = Path("./agents.json")
        self._load_agents()

    def _load_agents(self) -> None:
        """Load agents from file"""
        if self.agents_file.exists():
            with open(self.agents_file, "r") as f:
                self.agents = json.load(f)
            logger.info(f"Loaded {len(self.agents)} agents from file")
        else:
            self.agents = {}
            logger.info("No existing agents file, starting fresh")

    def _save_agents(self) -> None:
        """Save agents to file"""
        with open(self.agents_file, "w") as f:
            json.dump(self.agents, f, indent=2, default=str)
        logger.info(f"Saved {len(self.agents)} agents to file")

    def create_agent(self, agent_data: AgentCreate) -> AgentResponse:
        """Create a new agent"""
        try:
            agent_id = str(uuid.uuid4())
            now = datetime.now()

            agent = {
                "agent_id": agent_id,
                "name": agent_data.name,
                "system_instruction": agent_data.system_instruction,
                "index_name": agent_data.index_name,
                "temperature": agent_data.temperature,
                "max_tokens": agent_data.max_tokens,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }

            self.agents[agent_id] = agent
            self._save_agents()

            logger.info(f"Created agent: {agent_data.name} with ID: {agent_id}")
            return AgentResponse(**agent)
        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}")
            raise

    def get_agent(self, agent_id: str) -> Optional[AgentResponse]:
        """Get an agent by ID"""
        agent = self.agents.get(agent_id)
        if agent:
            return AgentResponse(**agent)
        logger.warning(f"Agent not found: {agent_id}")
        return None

    def list_agents(self) -> List[AgentResponse]:
        """List all agents"""
        logger.info(f"Listing {len(self.agents)} agents")
        return [AgentResponse(**agent) for agent in self.agents.values()]

    def update_agent(self, agent_id: str, agent_data: AgentUpdate) -> Optional[AgentResponse]:
        """Update an existing agent"""
        try:
            if agent_id not in self.agents:
                logger.warning(f"Agent not found for update: {agent_id}")
                return None

            agent = self.agents[agent_id]

            # Update fields
            if agent_data.system_instruction is not None:
                agent["system_instruction"] = agent_data.system_instruction
            if agent_data.index_name is not None:
                agent["index_name"] = agent_data.index_name
            if agent_data.temperature is not None:
                agent["temperature"] = agent_data.temperature
            if agent_data.max_tokens is not None:
                agent["max_tokens"] = agent_data.max_tokens

            agent["updated_at"] = datetime.now().isoformat()

            self.agents[agent_id] = agent
            self._save_agents()

            logger.info(f"Updated agent: {agent_id}")
            return AgentResponse(**agent)
        except Exception as e:
            logger.error(f"Error updating agent {agent_id}: {str(e)}")
            raise

    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        try:
            if agent_id in self.agents:
                del self.agents[agent_id]
                self._save_agents()
                logger.info(f"Deleted agent: {agent_id}")
                return True
            logger.warning(f"Agent not found for deletion: {agent_id}")
            return False
        except Exception as e:
            logger.error(f"Error deleting agent {agent_id}: {str(e)}")
            raise
