import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Globe,
  Factory,
  Search,
  Loader2,
  CheckCircle2,
  Github,
  ChevronDown,
  ChevronUp,
  Download,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import LocationInput from './components/LocationInput';

type ResearchStatus = {
  step: string;
  message: string;
};

type ResearchOutput = {
  summary: string;
  details: Record<string, any>;
};

// Add new types for query updates
type Query = {
  text: string;
  number: number;
  category: string;
};

// Add a new type for streaming queries
type StreamingQuery = {
  text: string;
  number: number;
  category: string;
  isComplete: boolean;
};

// Add to ResearchState type
type DocCount = {
  initial: number;
  kept: number;
};

type DocCounts = {
  company: DocCount;
  industry: DocCount;
  financial: DocCount;
  news: DocCount;
};

type BriefingStatus = {
  company: boolean;
  industry: boolean;
  financial: boolean;
  news: boolean;
};

// Add new types for enrichment
type EnrichmentCounts = {
  company: { total: number; enriched: number };
  industry: { total: number; enriched: number };
  financial: { total: number; enriched: number };
  news: { total: number; enriched: number };
};

type ResearchState = {
  status: string;
  message: string;
  queries: Query[];
  streamingQueries: Record<string, StreamingQuery>;
  docCounts?: DocCounts;
  enrichmentCounts?: EnrichmentCounts;
  briefingStatus: BriefingStatus;
};

console.log("=== DIRECT CONSOLE TEST ===");

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

if (!API_URL || !WS_URL) {
  throw new Error(
    "Environment variables VITE_API_URL and VITE_WS_URL must be set"
  );
}

// Log environment variables immediately
console.log({
  mode: import.meta.env.MODE,
  api_url: API_URL,
  ws_url: WS_URL,
});

// Add this near your other console.logs
console.log("Environment:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});

// Add a window load event
window.addEventListener("load", () => {
  console.log("=== Window Loaded ===");
  console.log("API URL (on load):", import.meta.env.VITE_API_URL);
});

// Add this near the top of the file, after the imports
const writingAnimation = `
@keyframes writing {
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.animate-writing {
  animation: writing 1.5s linear infinite;
}
`;

// Add this right after the imports
const style = document.createElement('style');
style.textContent = writingAnimation;
document.head.appendChild(style);

// Add this near your other styles at the top of the file
const colorAnimation = `
@keyframes colorTransition {
  0% { stroke: #468BFF; }
  15% { stroke: #8FBCFA; }
  30% { stroke: #468BFF; }
  45% { stroke: #FE363B; }
  60% { stroke: #FF9A9D; }
  75% { stroke: #FDBB11; }
  90% { stroke: #F6D785; }
  100% { stroke: #468BFF; }
}

.animate-colors {
  animation: colorTransition 8s ease-in-out infinite;
  animation-fill-mode: forwards;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Add transition for smoother color changes */
.loader-icon {
  transition: stroke 1s ease-in-out;
}
`;

// Add this right after the writingAnimation style
const colorStyle = document.createElement('style');
colorStyle.textContent = colorAnimation;
document.head.appendChild(colorStyle);

function App() {
  // Add useEffect for component mount logging
  useEffect(() => {
    console.log("=== Component Mounted ===");
    console.log("Form ready for submission");
  }, []);

  const [formData, setFormData] = useState({
    companyName: "",
    companyUrl: "",
    companyHq: "",
    companyIndustry: "",
  });
  const [isResearching, setIsResearching] = useState(false);
  const [status, setStatus] = useState<ResearchStatus | null>(null);
  const [output, setOutput] = useState<ResearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasFinalReport, setHasFinalReport] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000; // 2 seconds
  const [researchState, setResearchState] = useState<ResearchState>({
    status: "idle",
    message: "",
    queries: [],
    streamingQueries: {},
    briefingStatus: {
      company: false,
      industry: false,
      financial: false,
      news: false
    }
  });
  const [originalCompanyName, setOriginalCompanyName] = useState<string>("");

  // Add ref for status section
  const statusRef = useRef<HTMLDivElement>(null);

  // Add state to track initial scroll
  const [hasScrolledToStatus, setHasScrolledToStatus] = useState(false);

  // Modify the scroll helper function
  const scrollToStatus = () => {
    if (!hasScrolledToStatus && statusRef.current) {
      const yOffset = -20; // Reduced negative offset to scroll further down
      const y = statusRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setHasScrolledToStatus(true);
    }
  };

  // Add new state for query section collapse
  const [isQueriesExpanded, setIsQueriesExpanded] = useState(true);
  const [shouldShowQueries, setShouldShowQueries] = useState(false);
  
  // Add new state for tracking search phase
  const [isSearchPhase, setIsSearchPhase] = useState(false);

  // Add state for section collapse
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);
  const [isEnrichmentExpanded, setIsEnrichmentExpanded] = useState(true);

  // Add state for phase tracking
  const [currentPhase, setCurrentPhase] = useState<'search' | 'enrichment' | 'briefing' | 'complete' | null>(null);

  // Add new state for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [, setPdfUrl] = useState<string | null>(null);

  const [isResetting, setIsResetting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Add new state for color cycling
  const [loaderColor, setLoaderColor] = useState("#468BFF");
  
  // Add useEffect for color cycling
  useEffect(() => {
    if (!isResearching) return;
    
    const colors = [
      "#468BFF", // Blue
      "#8FBCFA", // Light Blue
      "#FE363B", // Red
      "#FF9A9D", // Light Red
      "#FDBB11", // Yellow
      "#F6D785", // Light Yellow
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % colors.length;
      setLoaderColor(colors[currentIndex]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isResearching]);

  const resetResearch = () => {
    setIsResetting(true);
    
    // Use setTimeout to create a smooth transition
    setTimeout(() => {
      setStatus(null);
      setOutput(null);
      setError(null);
      setIsComplete(false);
      setResearchState({
        status: "idle",
        message: "",
        queries: [],
        streamingQueries: {},
        briefingStatus: {
          company: false,
          industry: false,
          financial: false,
          news: false
        }
      });
      setPdfUrl(null);
      setCurrentPhase(null);
      setIsSearchPhase(false);
      setShouldShowQueries(false);
      setIsQueriesExpanded(true);
      setIsBriefingExpanded(true);
      setIsEnrichmentExpanded(true);
      setIsResetting(false);
      setHasScrolledToStatus(false); // Reset scroll flag when resetting research
    }, 300); // Match this with CSS transition duration
  };

  const connectWebSocket = (jobId: string) => {
    console.log("Initializing WebSocket connection for job:", jobId);
    const ws = new WebSocket(`${WS_URL}/research/ws/${jobId}`);

    ws.onopen = () => {
      console.log("WebSocket connection established for job:", jobId);
      setReconnectAttempts(0);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", {
        jobId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });

      if (isResearching && !hasFinalReport) {
        // Start polling for final report
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(() => checkForFinalReport(jobId), 5000);
        }

        // Attempt reconnection if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket(jobId);
          }, reconnectDelay);
        } else {
          console.log("Max reconnection attempts reached");
          setError("Connection lost. Checking for final report...");
          // Keep polling for final report
        }
      } else if (isResearching) {
        setError("Research connection lost. Please try again.");
        setIsResearching(false);
      }
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", {
        jobId,
        error: event
      });
      setError("WebSocket connection error");
      setIsResearching(false);
    };

    ws.onmessage = (event) => {
      const rawData = JSON.parse(event.data);
      console.log("WebSocket message received:", rawData);

      if (rawData.type === "status_update") {
        const statusData = rawData.data;
        console.log("Status update received:", statusData);

        // Handle phase transitions
        if (statusData.result?.step) {
          const step = statusData.result.step;
          if (step === "Search" && currentPhase !== 'search') {
            setCurrentPhase('search');
            setIsSearchPhase(true);
            setShouldShowQueries(true);
            setIsQueriesExpanded(true);
          } else if (step === "Enriching" && currentPhase !== 'enrichment') {
            setCurrentPhase('enrichment');
            setIsSearchPhase(false);
            setIsQueriesExpanded(false);
            setIsEnrichmentExpanded(true);
          } else if (step === "Briefing" && currentPhase !== 'briefing') {
            setCurrentPhase('briefing');
            setIsEnrichmentExpanded(false);
            setIsBriefingExpanded(true);
          }
        }

        // Handle completion
        if (statusData.status === "completed") {
          setCurrentPhase('complete');
          setIsComplete(true);
          setIsResearching(false);
          setStatus({
            step: "Complete",
            message: "Research completed successfully"
          });
          setOutput({
            summary: "",
            details: {
              report: statusData.result.report,
            },
          });
          setHasFinalReport(true);
          
          // Clear polling interval if it exists
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }

        // Set search phase when first query starts generating
        if (statusData.status === "query_generating" && !isSearchPhase) {
          setIsSearchPhase(true);
          setShouldShowQueries(true);
          setIsQueriesExpanded(true);
        }
        
        // End search phase and start enrichment when moving to next step
        if (statusData.result?.step && statusData.result.step !== "Search") {
          if (isSearchPhase) {
            setIsSearchPhase(false);
            // Add delay before collapsing queries
            setTimeout(() => {
              setIsQueriesExpanded(false);
            }, 1000);
          }
          
          // Handle enrichment phase
          if (statusData.result.step === "Enriching") {
            setIsEnrichmentExpanded(true);
            // Collapse enrichment section when complete
            if (statusData.status === "enrichment_complete") {
              setTimeout(() => {
                setIsEnrichmentExpanded(false);
              }, 1000);
            }
          }
          
          // Handle briefing phase
          if (statusData.result.step === "Briefing") {
            setIsBriefingExpanded(true);
            if (statusData.status === "briefing_complete" && statusData.result?.category) {
              // Update briefing status
              setResearchState((prev) => {
                const newBriefingStatus = {
                  ...prev.briefingStatus,
                  [statusData.result.category]: true
                };
                
                // Check if all briefings are complete
                const allBriefingsComplete = Object.values(newBriefingStatus).every(status => status);
                
                // Only collapse when all briefings are complete
                if (allBriefingsComplete) {
                  setTimeout(() => {
                    setIsBriefingExpanded(false);
                  }, 2000);
                }
                
                return {
                  ...prev,
                  briefingStatus: newBriefingStatus
                };
              });
            }
          }
        }

        // Handle enrichment-specific updates
        if (statusData.result?.step === "Enriching") {
          console.log("Enrichment status update:", statusData);
          
          // Initialize enrichment counts when starting a category
          if (statusData.status === "category_start") {
            const category = statusData.result.category as keyof EnrichmentCounts;
            if (category) {
              setResearchState((prev) => ({
                ...prev,
                enrichmentCounts: {
                  ...prev.enrichmentCounts,
                  [category]: {
                    total: statusData.result.count || 0,
                    enriched: 0
                  }
                } as EnrichmentCounts
              }));
            }
          }
          // Update enriched count when a document is processed
          else if (statusData.status === "extracted") {
            const category = statusData.result.category as keyof EnrichmentCounts;
            if (category) {
              setResearchState((prev) => {
                const currentCounts = prev.enrichmentCounts?.[category];
                if (currentCounts) {
                  return {
                    ...prev,
                    enrichmentCounts: {
                      ...prev.enrichmentCounts,
                      [category]: {
                        ...currentCounts,
                        enriched: Math.min(currentCounts.enriched + 1, currentCounts.total)
                      }
                    } as EnrichmentCounts
                  };
                }
                return prev;
              });
            }
          }
          // Handle extraction errors
          else if (statusData.status === "extraction_error") {
            const category = statusData.result.category as keyof EnrichmentCounts;
            if (category) {
              setResearchState((prev) => {
                const currentCounts = prev.enrichmentCounts?.[category];
                if (currentCounts) {
                  return {
                    ...prev,
                    enrichmentCounts: {
                      ...prev.enrichmentCounts,
                      [category]: {
                        ...currentCounts,
                        total: Math.max(0, currentCounts.total - 1)
                      }
                    } as EnrichmentCounts
                  };
                }
                return prev;
              });
            }
          }
          // Update final counts when a category is complete
          else if (statusData.status === "category_complete") {
            const category = statusData.result.category as keyof EnrichmentCounts;
            if (category) {
              setResearchState((prev) => ({
                ...prev,
                enrichmentCounts: {
                  ...prev.enrichmentCounts,
                  [category]: {
                    total: statusData.result.total || 0,
                    enriched: statusData.result.enriched || 0
                  }
                } as EnrichmentCounts
              }));
            }
          }
        }

        // Handle curation-specific updates
        if (statusData.result?.step === "Curation") {
          console.log("Curation status update:", {
            status: statusData.status,
            docCounts: statusData.result.doc_counts
          });
          
          // Initialize doc counts when curation starts
          if (statusData.status === "processing" && statusData.result.doc_counts) {
            setResearchState((prev) => ({
              ...prev,
              docCounts: statusData.result.doc_counts as DocCounts
            }));
          }
          // Update initial count for a category
          else if (statusData.status === "category_start") {
            const docType = statusData.result?.doc_type as keyof DocCounts;
            if (docType) {
              setResearchState((prev) => ({
                ...prev,
                docCounts: {
                  ...prev.docCounts,
                  [docType]: {
                    initial: statusData.result.initial_count,
                    kept: 0
                  } as DocCount
                } as DocCounts
              }));
            }
          }
          // Increment the kept count for a specific category
          else if (statusData.status === "document_kept") {
            const docType = statusData.result?.doc_type as keyof DocCounts;
            setResearchState((prev) => {
              if (docType && prev.docCounts?.[docType]) {
                return {
                  ...prev,
                  docCounts: {
                    ...prev.docCounts,
                    [docType]: {
                      initial: prev.docCounts[docType].initial,
                      kept: prev.docCounts[docType].kept + 1
                    }
                  } as DocCounts
                };
              }
              return prev;
            });
          }
          // Update final doc counts when curation is complete
          else if (statusData.status === "curation_complete" && statusData.result.doc_counts) {
            setResearchState((prev) => ({
              ...prev,
              docCounts: statusData.result.doc_counts as DocCounts
            }));
          }
        }

        // Handle briefing status updates
        if (statusData.status === "briefing_start") {
          setStatus({
            step: "Briefing",
            message: statusData.message
          });
        } else if (statusData.status === "briefing_complete" && statusData.result?.category) {
          const category = statusData.result.category;
          setResearchState((prev) => ({
            ...prev,
            briefingStatus: {
              ...prev.briefingStatus,
              [category]: true
            }
          }));
        }

        // Handle query updates
        if (statusData.status === "query_generating") {
          setResearchState((prev) => {
            const key = `${statusData.result.category}-${statusData.result.query_number}`;
            return {
              ...prev,
              streamingQueries: {
                ...prev.streamingQueries,
                [key]: {
                  text: statusData.result.query,
                  number: statusData.result.query_number,
                  category: statusData.result.category,
                  isComplete: false
                }
              }
            };
          });
        } else if (statusData.status === "query_generated") {
          setResearchState((prev) => {
            // Remove from streaming queries and add to completed queries
            const key = `${statusData.result.category}-${statusData.result.query_number}`;
            const { [key]: _, ...remainingStreamingQueries } = prev.streamingQueries;
            
            return {
              ...prev,
              streamingQueries: remainingStreamingQueries,
              queries: [
                ...prev.queries,
                {
                  text: statusData.result.query,
                  number: statusData.result.query_number,
                  category: statusData.result.category,
                },
              ],
            };
          });
        }
        // Handle report streaming
        else if (statusData.status === "report_chunk") {
          setOutput((prev) => ({
            summary: "Generating report...",
            details: {
              report: prev?.details?.report
                ? prev.details.report + statusData.result.chunk
                : statusData.result.chunk,
            },
          }));
        }
        // Handle other status updates
        else if (statusData.status === "processing") {
          setIsComplete(false);
          // Only update status.step if we're not in curation or the new step is curation
          if (!status?.step || status.step !== "Curation" || statusData.result?.step === "Curation") {
            setStatus({
              step: statusData.result?.step || "Processing",
              message: statusData.message || "Processing...",
            });
          }
          
          // Reset briefing status when starting a new research
          if (statusData.result?.step === "Briefing") {
            setResearchState((prev) => ({
              ...prev,
              briefingStatus: {
                company: false,
                industry: false,
                financial: false,
                news: false
              }
            }));
          }
          
          scrollToStatus();
        } else if (
          statusData.status === "failed" ||
          statusData.status === "error" ||
          statusData.status === "website_error"
        ) {
          setError(statusData.error || statusData.message || "Research failed");
          if (statusData.status === "website_error" && statusData.result?.continue_research) {
            // Don't stop research on website error if continue_research is true
            console.log("Continuing research despite website error:", statusData.error);
          } else {
            setIsResearching(false);
            setIsComplete(false);
          }
        }
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    // If research is complete, reset the UI first
    if (isComplete) {
      resetResearch();
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for reset animation
    }

    // Reset states
    setHasFinalReport(false);
    setReconnectAttempts(0);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setIsResearching(true);
    setOriginalCompanyName(formData.companyName);
    setHasScrolledToStatus(false); // Reset scroll flag when starting new research

    try {
      const url = `${API_URL}/research`;
      console.log("Attempting fetch to:", url);

      // Format the company URL if provided
      const formattedCompanyUrl = formData.companyUrl
        ? formData.companyUrl.startsWith('http://') || formData.companyUrl.startsWith('https://')
          ? formData.companyUrl
          : `https://${formData.companyUrl}`
        : undefined;

      // Log the request details
      const requestData = {
        company: formData.companyName,
        company_url: formattedCompanyUrl,
        industry: formData.companyIndustry || undefined,
        hq_location: formData.companyHq || undefined,
      };
      console.log("Request data:", requestData);

      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }).catch((error) => {
        console.error("Fetch error:", error);
        throw error;
      });

      console.log("Response received:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.job_id) {
        console.log("Connecting WebSocket with job_id:", data.job_id);
        connectWebSocket(data.job_id);
      } else {
        throw new Error("No job ID received");
      }
    } catch (err) {
      console.log("Caught error:", err);
      setError(err instanceof Error ? err.message : "Failed to start research");
      setIsResearching(false);
    }
  };

  // Add new function to handle PDF generation
  const handleGeneratePdf = async () => {
    if (!output || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    try {
      console.log("Generating PDF with company name:", originalCompanyName);
      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_content: output.details.report,
          company_name: originalCompanyName || output.details.company
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to generate PDF');
      }
      
      const data = await response.json();
      
      // Immediately trigger download
      const downloadUrl = `${API_URL}${data.pdf_url}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadUrl.split('/').pop() || 'research_report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Add new function to handle copying to clipboard
  const handleCopyToClipboard = async () => {
    if (!output?.details?.report) return;
    
    try {
      await navigator.clipboard.writeText(output.details.report);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Add document count display component

  // Add BriefingProgress component

  // Add EnrichmentProgress component

  // Add these styles at the top of the component, before the return statement
  const glassStyle = "backdrop-filter backdrop-blur-lg bg-white/80 border border-gray-200 shadow-xl";
  const glassCardStyle = `${glassStyle} rounded-2xl p-6`;
  const glassInputStyle = `${glassStyle} pl-10 w-full rounded-lg py-3 px-4 text-gray-900 focus:border-[#468BFF]/50 focus:outline-none focus:ring-1 focus:ring-[#468BFF]/50 placeholder-gray-400 bg-white/80 shadow-none`;

  // Add these to your existing styles
  const fadeInAnimation = "transition-all duration-300 ease-in-out";

  // Function to render progress components in order
  const renderProgressComponents = () => {
    const components = [];

    // Research Report (always at the top when available)
    if (output && output.details) {
      components.push(
        <div 
          key="report" 
          className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
        >
          <div className="flex justify-end gap-2 mb-4">
            {output?.details?.report && (
              <>
                <button
                  onClick={handleCopyToClipboard}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#468BFF] text-white hover:bg-[#8FBCFA] transition-all duration-200"
                >
                  {isCopied ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FFB800] text-white hover:bg-[#FFA800] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" style={{ stroke: loaderColor }} />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="mt-4">
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={{
                  div: ({node, ...props}) => (
                    <div className="space-y-4 text-gray-800" {...props} />
                  ),
                  h1: ({node, children, ...props}) => {
                    // Get the text content of the h1
                    const text = String(children);
                    // Check if this is the first h1 by looking for "Research Report"
                    const isFirstH1 = text.includes("Research Report");
                    // Check if this is the References heading
                    const isReferences = text.includes("References");
                    return (
                      <div>
                        <h1 
                          className={`font-bold text-gray-900 break-words whitespace-pre-wrap ${isFirstH1 ? 'text-5xl mb-10 mt-4 max-w-[calc(100%-8rem)]' : 'text-3xl mb-6'}`} 
                          {...props} 
                        >
                          {children}
                        </h1>
                        {isReferences && (
                          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>
                        )}
                      </div>
                    );
                  },
                  h2: ({node, ...props}) => (
                    <h2 className="text-3xl font-bold text-gray-900 first:mt-2 mt-8 mb-4" {...props} />
                  ),
                  h3: ({node, ...props}) => (
                    <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3" {...props} />
                  ),
                  p: ({node, children, ...props}) => {
                    // Check if this paragraph is acting as a subsection header
                    const text = String(children);
                    const isSubsectionHeader = (
                      text.includes('\n') === false && 
                      text.length < 50 && 
                      (text.endsWith(':') || /^[A-Z][A-Za-z\s\/]+$/.test(text))
                    );
                    
                    if (isSubsectionHeader) {
                      return (
                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                          {text.endsWith(':') ? text.slice(0, -1) : text}
                        </h3>
                      );
                    }
                    
                    // Check if this is a bullet point label (often used as mini headers)
                    const isBulletLabel = text.startsWith('•') && text.includes(':');
                    if (isBulletLabel) {
                      const [label, content] = text.split(':');
                      return (
                        <div className="text-gray-800 my-2">
                          <span className="font-semibold text-gray-900">
                            {label.replace('•', '').trim()}:
                          </span>
                          {content}
                        </div>
                      );
                    }
                    
                    // Convert URLs in text to clickable links
                    const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
                    if (urlRegex.test(text)) {
                      const parts = text.split(urlRegex);
                      return (
                        <p className="text-gray-800 my-2" {...props}>
                          {parts.map((part, i) => 
                            urlRegex.test(part) ? (
                              <a 
                                key={i}
                                href={part}
                                className="text-[#468BFF] hover:text-[#8FBCFA] underline decoration-[#468BFF] hover:decoration-[#8FBCFA] cursor-pointer transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {part}
                              </a>
                            ) : part
                          )}
                        </p>
                      );
                    }
                    
                    return <p className="text-gray-800 my-2" {...props}>{children}</p>;
                  },
                  ul: ({node, ...props}) => (
                    <ul className="text-gray-800 space-y-1 list-disc pl-6" {...props} />
                  ),
                  li: ({node, ...props}) => (
                    <li className="text-gray-800" {...props} />
                  ),
                  a: ({node, href, ...props}) => (
                    <a 
                      href={href}
                      className="text-[#468BFF] hover:text-[#8FBCFA] underline decoration-[#468BFF] hover:decoration-[#8FBCFA] cursor-pointer transition-colors" 
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props} 
                    />
                  ),
                }}
              >
                {output.details.report || "No report available"}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      );
    }

    // Current phase component
    if (currentPhase === 'briefing' || (currentPhase === 'complete' && researchState.briefingStatus)) {
      components.push(
        <div 
          key="briefing" 
          className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsBriefingExpanded(!isBriefingExpanded)}
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Research Briefings
            </h2>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              {isBriefingExpanded ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isBriefingExpanded ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-4 gap-4">
              {['company', 'industry', 'financial', 'news'].map((category) => (
                <div 
                  key={category} 
                  className={`${glassStyle} rounded-xl p-3 transition-all duration-500 ${
                    researchState.briefingStatus[category as keyof BriefingStatus] 
                      ? 'border-2 border-[#8FBCFA] shadow-[0_0_15px_rgba(143,188,250,0.15)]' 
                      : 'border border-gray-200'
                  } bg-white/80 backdrop-blur-sm`}
                >
                  <h3 className="text-sm font-medium text-gray-700 capitalize text-center">{category}</h3>
                </div>
              ))}
            </div>
          </div>

          {!isBriefingExpanded && (
            <div className="mt-2 text-sm text-gray-600">
              {Object.values(researchState.briefingStatus).filter(Boolean).length} of {Object.keys(researchState.briefingStatus).length} briefings completed
            </div>
          )}
        </div>
      );
    }

    if (currentPhase === 'enrichment' || currentPhase === 'briefing' || currentPhase === 'complete') {
      components.push(
        <div 
          key="enrichment" 
          className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsEnrichmentExpanded(!isEnrichmentExpanded)}
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Curation and Extraction
            </h2>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              {isEnrichmentExpanded ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isEnrichmentExpanded ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-4 gap-4">
              {['company', 'industry', 'financial', 'news'].map((category) => {
                const counts = researchState.enrichmentCounts?.[category as keyof EnrichmentCounts];
                return (
                  <div key={category} className="backdrop-blur-2xl bg-white/95 border border-gray-200/50 rounded-xl p-3 shadow-none">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">{category}</h3>
                    <div className="text-gray-900">
                      <div className="text-2xl font-bold mb-1">
                        {counts ? (
                          <span className="text-[#468BFF]">
                            {counts.enriched}
                          </span>
                        ) : (
                          <Loader2 className="animate-spin h-6 w-6 mx-auto loader-icon" style={{ stroke: loaderColor }} />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {counts ? (
                          `selected from ${counts.total}`
                        ) : (
                          "waiting..."
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isEnrichmentExpanded && researchState.enrichmentCounts && (
            <div className="mt-2 text-sm text-gray-600">
              {Object.values(researchState.enrichmentCounts).reduce((acc, curr) => acc + curr.enriched, 0)} documents enriched from {Object.values(researchState.enrichmentCounts).reduce((acc, curr) => acc + curr.total, 0)} total
            </div>
          )}
        </div>
      );
    }

    // Queries are always at the bottom when visible
    if (shouldShowQueries && (researchState.queries.length > 0 || Object.keys(researchState.streamingQueries).length > 0)) {
      components.push(
        <div 
          key="queries" 
          className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
        >
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsQueriesExpanded(!isQueriesExpanded)}
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Generated Research Queries
            </h2>
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              {isQueriesExpanded ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isQueriesExpanded ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-2 gap-4">
              {['company', 'industry', 'financial', 'news'].map((category) => (
                <div key={category} className={`${glassStyle} rounded-xl p-3`}>
                  <h3 className="text-base font-medium text-gray-900 mb-3 capitalize">
                    {category.charAt(0).toUpperCase() + category.slice(1)} Queries
                  </h3>
                  <div className="space-y-2">
                    {/* Show streaming queries first */}
                    {Object.entries(researchState.streamingQueries)
                      .filter(([key]) => key.startsWith(`${category}_analyzer`))
                      .map(([key, query]) => (
                        <div key={key} className="backdrop-filter backdrop-blur-lg bg-white/80 border border-[#468BFF]/30 rounded-lg p-2">
                          <span className="text-gray-600">{query.text}</span>
                          <span className="animate-pulse ml-1 text-[#8FBCFA]">|</span>
                        </div>
                      ))}
                    {/* Then show completed queries */}
                    {researchState.queries
                      .filter((q) => q.category === `${category}_analyzer`)
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
          
          {!isQueriesExpanded && (
            <div className="mt-2 text-sm text-gray-600">
              {researchState.queries.length} queries generated across {['company', 'industry', 'financial', 'news'].length} categories
            </div>
          )}
        </div>
      );
    }

    return components;
  };

  // Add function to check for final report
  const checkForFinalReport = async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/research/status/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      
      const data = await response.json();
      
      if (data.status === "completed" && data.result?.report) {
        setOutput({
          summary: "",
          details: {
            report: data.result.report,
          },
        });
        setStatus({
          step: "Complete",
          message: "Research completed successfully"
        });
        setIsComplete(true);
        setIsResearching(false);
        setCurrentPhase('complete');
        setHasFinalReport(true);
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error checking final report:', error);
    }
  };

  // Add cleanup for polling interval
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-gray-50 to-white p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(70,139,255,0.35)_1px,transparent_0)] bg-[length:24px_24px] bg-center"></div>
      <div className="max-w-5xl mx-auto space-y-8 relative">
        {/* Header with GitHub Link */}
        <div className="relative mb-16">
          <div className="text-center pt-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a365d] via-[#2563eb] to-[#1a365d] bg-clip-text text-transparent mb-4">
              Company Research Agent
            </h1>
            <p className="text-gray-600 text-lg">
              Conduct in-depth company diligence powered by Tavily
            </p>
          </div>
          <div className="absolute top-0 right-0 flex items-center space-x-2">
            <a
              href="https://tavily.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-600 hover:text-gray-900 transition-colors ${glassStyle} w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden`}
              aria-label="Tavily Website"
            >
              <img src="/tavilylogo.png" alt="Tavily Logo" className="w-full h-full object-cover" />
            </a>
            <a
              href="https://github.com/pogjester"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-600 hover:text-gray-900 transition-colors ${glassStyle} p-3 rounded-lg`}
              aria-label="GitHub Profile"
            >
              <Github className="h-7 w-7" />
            </a>
          </div>
        </div>

        {/* Form Section */}
        <div className={`${glassCardStyle} backdrop-blur-2xl bg-white/90 border-gray-200/50 shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Company Name */}
              <div className="relative group">
                <label
                  htmlFor="companyName"
                  className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900"
                >
                  Company Name <span className="text-gray-900/70">*</span>
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
                    className={`${glassInputStyle} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12`}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              {/* Company URL */}
              <div className="relative group">
                <label
                  htmlFor="companyUrl"
                  className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900"
                >
                  Company URL
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
                    className={`${glassInputStyle} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12`}
                    placeholder="example.com"
                  />
                </div>
              </div>

              {/* Company HQ */}
              <div className="relative group">
                <label
                  htmlFor="companyHq"
                  className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900"
                >
                  Company HQ
                </label>
                <LocationInput
                  value={formData.companyHq}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyHq: value,
                    }))
                  }
                  className={`${glassInputStyle} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12`}
                />
              </div>

              {/* Company Industry */}
              <div className="relative group">
                <label
                  htmlFor="companyIndustry"
                  className="block text-base font-medium text-gray-700 mb-2.5 transition-all duration-200 group-hover:text-gray-900"
                >
                  Company Industry
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
                    className={`${glassInputStyle} transition-all duration-300 focus:border-[#468BFF]/50 focus:ring-1 focus:ring-[#468BFF]/50 group-hover:border-[#468BFF]/30 bg-white/80 backdrop-blur-sm text-lg py-4 pl-12`}
                    placeholder="e.g. Technology, Healthcare"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isResearching || !formData.companyName}
              className="relative group w-fit mx-auto block overflow-hidden rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 transition-all duration-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-12"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center py-3.5">
                {isResearching ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 loader-icon" style={{ stroke: loaderColor }} />
                    <span className="text-base font-medium text-gray-900/90">Researching...</span>
                  </>
                ) : (
                  <>
                    <Search className="-ml-1 mr-2 h-5 w-5 text-gray-900/90" />
                    <span className="text-base font-medium text-gray-900/90">Start Research</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className={`${glassCardStyle} border-[#FE363B]/30 bg-[#FE363B]/10 ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'}`}
          >
            <p className="text-[#FE363B]">{error}</p>
          </div>
        )}

        {/* Status Box */}
        {status && (
          <div 
            ref={statusRef} 
            className={`${glassCardStyle} ${fadeInAnimation} ${isResetting ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'} bg-white/80 backdrop-blur-sm border-gray-200`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {error ? (
                  <div className={`${glassStyle} p-2 rounded-full bg-[#FE363B]/10 border-[#FE363B]/20`}>
                    <XCircle className="h-5 w-5 text-[#FE363B]" />
                  </div>
                ) : status?.step === "Complete" || isComplete ? (
                  <div className={`${glassStyle} p-2 rounded-full bg-[#22C55E]/10 border-[#22C55E]/20`}>
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                  </div>
                ) : currentPhase === 'search' || currentPhase === 'enrichment' || (status?.step === "Processing" && status.message.includes("scraping")) ? (
                  <div className={`${glassStyle} p-2 rounded-full bg-[#468BFF]/10 border-[#468BFF]/20`}>
                    <Loader2 className="h-5 w-5 animate-spin loader-icon" style={{ stroke: loaderColor }} />
                  </div>
                ) : currentPhase === 'briefing' ? (
                  <div className={`${glassStyle} p-2 rounded-full bg-[#468BFF]/10 border-[#468BFF]/20`}>
                    <Loader2 className="h-5 w-5 animate-spin loader-icon" style={{ stroke: loaderColor }} />
                  </div>
                ) : (
                  <div className={`${glassStyle} p-2 rounded-full bg-[#468BFF]/10 border-[#468BFF]/20`}>
                    <Loader2 className="h-5 w-5 animate-spin loader-icon" style={{ stroke: loaderColor }} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900/90">{status.step}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {error || status.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Components Container */}
        <div className="space-y-12 transition-all duration-500 ease-in-out">
          {renderProgressComponents()}
        </div>
      </div>
    </div>
  );
}

export default App;
