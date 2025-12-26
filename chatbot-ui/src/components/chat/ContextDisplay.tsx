import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import type { ContextDocument } from '../../types/agent.types';

interface ContextDisplayProps {
  contextDocuments: ContextDocument[] | null | undefined;
  compact?: boolean; // For mobile view
}

const ContextDisplay: React.FC<ContextDisplayProps> = ({ contextDocuments, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
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
    <div className={`${compact ? '' : 'p-4'}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${
          compact ? 'p-3 bg-purple-50' : 'p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl mb-3'
        } hover:bg-purple-100 transition-colors border border-purple-200`}
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-purple-500 rounded-lg">
            <Sparkles className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
          </div>
          <div className="text-left">
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
              Retrieved Context
            </h3>
            <p className="text-xs text-gray-600">
              {contextDocuments.length} source{contextDocuments.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {contextDocuments.map((doc, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleDoc(index)}
                className="w-full flex items-start justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      Source {index + 1}
                    </span>
                    {doc.metadata?.page && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Page {doc.metadata.page}
                      </span>
                    )}
                  </div>
                  {doc.metadata?.source && (
                    <p className="text-xs text-gray-500 truncate mb-1.5">
                      {typeof doc.metadata.source === 'string' &&
                        doc.metadata.source.split('/').pop()}
                    </p>
                  )}
                  <p className={`text-xs sm:text-sm text-gray-600 ${expandedDocs.has(index) ? '' : 'line-clamp-2'}`}>
                    {doc.content}
                  </p>
                </div>
                {expandedDocs.has(index) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                )}
              </button>

              {expandedDocs.has(index) && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 animate-fadeIn">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {doc.content}
                    </p>
                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                          Metadata
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(doc.metadata).map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg p-2 border border-gray-200">
                              <span className="text-xs font-medium text-gray-600 block mb-0.5">
                                {key}
                              </span>
                              <span className="text-xs text-gray-900 break-words">
                                {typeof value === 'string' && value.length > 50
                                  ? value.substring(0, 50) + '...'
                                  : JSON.stringify(value)}
                              </span>
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
