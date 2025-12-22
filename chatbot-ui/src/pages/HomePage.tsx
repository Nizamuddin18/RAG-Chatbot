import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, FileText, Database, MessageSquare } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Bot,
      title: 'Agent Management',
      description: 'Create and manage AI agents with custom system instructions',
      link: '/agents',
      color: 'text-blue-600',
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Upload and manage PDF documents for your knowledge base',
      link: '/documents',
      color: 'text-green-600',
    },
    {
      icon: Database,
      title: 'Vector Indexes',
      description: 'Manage Pinecone indexes for efficient document retrieval',
      link: '/indexes',
      color: 'text-purple-600',
    },
    {
      icon: MessageSquare,
      title: 'Chat Interface',
      description: 'Interact with your AI agents powered by RAG',
      link: '/chat',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to RAG Chatbot
        </h1>
        <p className="text-lg text-gray-600">
          A production-ready platform for building RAG-powered AI chatbots
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature) => (
          <Card key={feature.title} hover>
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-gray-100 ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <Link to={feature.link}>
                  <Button variant="ghost" size="sm">
                    Get Started →
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-primary-50 border-2 border-primary-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-700 mb-6">
            Create your first AI agent and start chatting!
          </p>
          <Link to="/agents">
            <Button variant="primary" size="lg">
              Create Agent
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
