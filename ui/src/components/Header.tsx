import React from 'react';
import { Github } from 'lucide-react';
import { translations } from '../utils/translations';

interface HeaderProps {
  glassStyle: string;
  language: 'en' | 'ja';
  onLanguageChange: (lang: 'en' | 'ja') => void;
}

const Header: React.FC<HeaderProps> = ({ glassStyle, language, onLanguageChange }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load Tavily logo');
    console.log('Image path:', e.currentTarget.src);
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="relative mb-16">
      <div className="text-center pt-4">
        <h1 className="text-[48px] font-medium text-[#1a202c] font-['DM_Sans'] tracking-[-1px] leading-[52px] text-center mx-auto antialiased">
          {translations[language].title}
        </h1>
        <p className="text-gray-600 text-lg font-['DM_Sans'] mt-4">
          {translations[language].tagline}
        </p>
      </div>
      <div className="absolute top-0 right-0 flex items-center space-x-2">
        <a
          href="https://tavily.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-gray-600 hover:text-gray-900 transition-colors ${glassStyle} rounded-lg flex items-center justify-center`}
          style={{ width: '50px', height: '50px', padding: '2px' }}
          aria-label="Tavily Website"
        >
          <img 
            src="/tavilylogo.png" 
            alt="Tavily Logo" 
            className="w-full h-full object-contain" 
            style={{ 
              width: '45px', 
              height: '45px',
              display: 'block',
              margin: 'auto'
            }}
            onError={handleImageError}
          />
        </a>
        <a
          href="https://github.com/pogjester/company-research-agent"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-gray-600 hover:text-gray-900 transition-colors ${glassStyle} rounded-lg flex items-center justify-center`}
          style={{ width: '40px', height: '40px', padding: '8px' }}
          aria-label="GitHub Profile"
        >
          <Github
            style={{
              width: '24px',
              height: '24px',
              display: 'block',
              margin: 'auto'
            }}
          />
        </a>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as 'en' | 'ja')}
          className="border rounded p-1 text-sm"
        >
          <option value="en">EN</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </div>
  );
};

export default Header; 

