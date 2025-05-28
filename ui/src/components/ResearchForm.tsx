import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../utils/translations';
import { Building2, Factory, Globe, Loader2, Search } from 'lucide-react';
import LocationInput from './LocationInput';
import ExamplePopup, { ExampleCompany } from './ExamplePopup';

interface FormData {
  companyName: string;
  companyUrl: string;
  companyHq: string;
  companyIndustry: string;
}

interface ResearchFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isResearching: boolean;
  glassStyle: {
    card: string;
    input: string;
  };
  loaderColor: string;
  language: 'en' | 'ja';
}

const ResearchForm: React.FC<ResearchFormProps> = ({
  onSubmit,
  isResearching,
  glassStyle,
  loaderColor,
  language
}) => {
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companyUrl: "",
    companyHq: "",
    companyIndustry: "",
  });
  
  // Animation states
  const [showExampleSuggestion, setShowExampleSuggestion] = useState(true);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [wasResearching, setWasResearching] = useState(false);
  
  // Refs for form fields for animation
  const formRef = useRef<HTMLDivElement>(null);
  const exampleRef = useRef<HTMLDivElement>(null);
  
  // Hide example suggestion when form is filled
  useEffect(() => {
    if (formData.companyName) {
      setShowExampleSuggestion(false);
    } else if (!isExampleAnimating) {
      setShowExampleSuggestion(true);
    }
  }, [formData.companyName, isExampleAnimating]);

  // Track research state changes to show example popup when research completes
  useEffect(() => {
    // If we were researching and now we're not, research just completed
    if (wasResearching && !isResearching) {
      // Add a slight delay to let animations complete
      setTimeout(() => {
        // Reset form fields to empty values
        setFormData({
          companyName: "",
          companyUrl: "",
          companyHq: "",
          companyIndustry: "",
        });
        
        // Show the example suggestion again
        setShowExampleSuggestion(true);
      }, 1000);
    }
    
    // Update tracking state
    setWasResearching(isResearching);
  }, [isResearching, wasResearching]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  const fillExampleData = (example: ExampleCompany) => {
    // Start animation
    setIsExampleAnimating(true);
    
    // Animate the suggestion moving into the form
    if (exampleRef.current && formRef.current) {
      const exampleRect = exampleRef.current.getBoundingClientRect();
      const formRect = formRef.current.getBoundingClientRect();
      
      // Calculate the distance to move
      const moveX = formRect.left + 20 - exampleRect.left;
      const moveY = formRect.top + 20 - exampleRect.top;
      
      // Apply animation
      exampleRef.current.style.transform = `translate(${moveX}px, ${moveY}px) scale(0.6)`;
      exampleRef.current.style.opacity = '0';
    }
    
    // Fill in form data after a short delay for animation
    setTimeout(() => {
      const newFormData = {
        companyName: example.name,
        companyUrl: example.url,
        companyHq: example.hq,
        companyIndustry: example.industry
      };
      
      // Update form data
      setFormData(newFormData);
      
      // Start research automatically (only if not already researching)
      if (!isResearching) {
        onSubmit(newFormData);
      }
      
      setIsExampleAnimating(false);
    }, 500);
  };

  return (
    <div className="relative" ref={formRef}>
      {/* Example Suggestion */}
      <ExamplePopup 
        visible={showExampleSuggestion}
        onExampleSelect={fillExampleData}
        glassStyle={glassStyle}
        exampleRef={exampleRef}
      />

      {/* Main Form */}
      <div className={`${glassStyle.card} backdrop-blur-2xl bg-white/90 border-gray-200/50 shadow-xl`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Name */}
            <div className="relative group">
              <label
                htmlFor="companyName"
                className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900 font-['DM_Sans']"
              >
                {translations[language].companyName} <span className="text-gray-900/70">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 stroke-[#468BFF] transition-all duration-200 group-hover:stroke-[#8FBCFA] z-10" strokeWidth={1.5} />
                <input
                  required
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  className={`${glassStyle.input} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12 font-['DM_Sans']`}
                  placeholder={translations[language].placeholderName}
                />
              </div>
            </div>

            {/* Company URL */}
            <div className="relative group">
              <label
                htmlFor="companyUrl"
                className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900 font-['DM_Sans']"
              >
                {translations[language].companyUrl}
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 stroke-[#468BFF] transition-all duration-200 group-hover:stroke-[#8FBCFA] z-10" strokeWidth={1.5} />
                <input
                  id="companyUrl"
                  type="text"
                  value={formData.companyUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyUrl: e.target.value,
                    }))
                  }
                  className={`${glassStyle.input} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12 font-['DM_Sans']`}
                  placeholder={translations[language].placeholderUrl}
                />
              </div>
            </div>

            {/* Company HQ */}
            <div className="relative group">
              <label
                htmlFor="companyHq"
                className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900 font-['DM_Sans']"
              >
                {translations[language].companyHq}
              </label>
              <LocationInput
                value={formData.companyHq}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyHq: value,
                  }))
                }
                className={`${glassStyle.input} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12 font-['DM_Sans']`}
              />
            </div>

            {/* Company Industry */}
            <div className="relative group">
              <label
                htmlFor="companyIndustry"
                className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900 font-['DM_Sans']"
              >
                {translations[language].companyIndustry}
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <Factory className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 stroke-[#468BFF] transition-all duration-200 group-hover:stroke-[#8FBCFA] z-10" strokeWidth={1.5} />
                <input
                  id="companyIndustry"
                  type="text"
                  value={formData.companyIndustry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyIndustry: e.target.value,
                    }))
                  }
                  className={`${glassStyle.input} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12 font-['DM_Sans']`}
                  placeholder={translations[language].placeholderIndustry}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isResearching || !formData.companyName}
            className="relative group w-fit mx-auto block overflow-hidden rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 transition-all duration-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-12 font-['DM_Sans']"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center py-3.5">
              {isResearching ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 loader-icon" style={{ stroke: loaderColor }} />
                  <span className="text-base font-medium text-gray-900/90">{translations[language].researching}</span>
                </>
              ) : (
                <>
                  <Search className="-ml-1 mr-2 h-5 w-5 text-gray-900/90" />
                  <span className="text-base font-medium text-gray-900/90">{translations[language].startResearch}</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResearchForm; 
