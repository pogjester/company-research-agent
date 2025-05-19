import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResearchQueriesProps } from '../types';
import { translations } from '../utils/translations';

const ResearchQueries: React.FC<ResearchQueriesProps & { language: 'en' | 'ja' }> = ({
  queries,
  streamingQueries,
  isExpanded,
  onToggleExpand,
  isResetting,
  glassStyle,
  language
}) => {
  const glassCardStyle = `${glassStyle} rounded-2xl p-6`;
  const fadeInAnimation = "transition-all duration-300 ease-in-out";

  return (
    <div 
      className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'} font-['DM_Sans']`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <h2 className="text-xl font-semibold text-gray-900">
          {translations[language].generatedQueries}
        </h2>
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          {isExpanded ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronDown className="h-6 w-6" />
          )}
        </button>
      </div>
      
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isExpanded ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="grid grid-cols-2 gap-4">
          {['company', 'industry', 'financial', 'news'].map((category) => (
            <div key={category} className={`${glassStyle} rounded-xl p-3`}>
              <h3 className="text-base font-medium text-gray-900 mb-3 capitalize">
                {category.charAt(0).toUpperCase() + category.slice(1)} Queries
              </h3>
              <div className="space-y-2">
                {/* Show streaming queries first */}
                {Object.entries(streamingQueries)
                  .filter(([key]) => key.startsWith(category))
                  .map(([key, query]) => (
                    <div key={key} className="backdrop-filter backdrop-blur-lg bg-white/80 border border-[#468BFF]/30 rounded-lg p-2">
                      <span className="text-gray-600">{query.text}</span>
                      <span className="animate-pulse ml-1 text-[#8FBCFA]">|</span>
                    </div>
                  ))}
                {/* Then show completed queries */}
                {queries
                  .filter((q) => q.category.startsWith(category))
                  .map((query, idx) => (
                    <div key={idx} className="backdrop-filter backdrop-blur-lg bg-white/80 border border-gray-200 rounded-lg p-2">
                      <span className="text-gray-600">{query.text}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {!isExpanded && (
        <div className="mt-2 text-sm text-gray-600">
          {queries.length} {language === 'ja' ? '件のクエリが生成されました' : 'queries generated'}
        </div>
      )}
    </div>
  );
};

export default ResearchQueries; 

