import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import type { ContextDocument } from '../../types/agent.types';

interface ContextDisplayProps {
  contextDocuments: ContextDocument[] | null | undefined;
}

const ContextDisplay: React.FC<ContextDisplayProps> = ({ contextDocuments }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());

  if (!contextDocuments || contextDocuments.length === 0) {
    return null;
  }

  const toggleDoc = (index: number) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDocs(newExpanded);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            Retrieved Context ({contextDocuments.length})
          </h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {contextDocuments.map((doc, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleDoc(index)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      Document {index + 1}
                    </span>
                    {doc.metadata?.source && (
                      <span className="text-xs text-gray-500 truncate">
                        {doc.metadata.source}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {doc.content}
                  </p>
                </div>
                {expandedDocs.has(index) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
                )}
              </button>

              {expandedDocs.has(index) && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{doc.content}</p>
                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Metadata:</p>
                        <div className="space-y-1">
                          {Object.entries(doc.metadata).map(([key, value]) => (
                            <div key={key} className="flex items-start space-x-2 text-xs">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-900">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContextDisplay;
