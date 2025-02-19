import os
import asyncio
from datetime import datetime
from openai import AsyncOpenAI
from tavily import AsyncTavilyClient
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class BaseResearcher:
    def __init__(self):
        tavily_key = os.getenv("TAVILY_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if not tavily_key or not openai_key:
            raise ValueError("Missing API keys")
            
        self.tavily_client = AsyncTavilyClient(api_key=tavily_key)
        self.openai_client = AsyncOpenAI(api_key=openai_key)

    async def generate_queries(self, state: Dict, prompt: str) -> List[str]:
        company = state.get("company", "Unknown Company")
        current_year = datetime.now().year
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": f"""Researching {company} on {datetime.now().strftime("%B %d, %Y")}.
{self._format_query_prompt(prompt, company, current_year)}"""
                }],
                temperature=0,
                max_tokens=4096
            )
            
            # Log the response for debugging
            logger.debug(f"OpenAI response: {response}")

            queries = [
                q.strip() 
                for q in response.choices[0].message.content.splitlines() 
                if q.strip()
            ]
            
            if not queries:
                raise ValueError(f"No queries generated for {company}")

            return queries[:4]  # Ensure max 4 queries
            
        except Exception as e:
            logger.error(f"Error generating queries for {company}: {e}")
            # Send error status
            if websocket_manager := state.get('websocket_manager'):
                if job_id := state.get('job_id'):
                    await websocket_manager.send_status_update(
                        job_id=job_id,
                        status="error",
                        message=f"Failed to generate research queries: {str(e)}",
                        error=f"Query generation failed: {str(e)}"
                    )
            return []

    def _format_query_prompt(self, prompt, company, year):
        return f"""{prompt}

        Important Guidelines:
        - Focus ONLY on {company}-specific information
        - Include the year {year} in each query
        - Make queries brief and broad-sweeping
        - Provide exactly 4 search queries (one per line)"""

    def _fallback_queries(self, company, year):
        return [
            f"{company} overview {year}",
            f"{company} recent news {year}",
            f"{company} financial reports {year}",
            f"{company} industry analysis {year}"
        ]

    async def search_single_query(self, query: str) -> Dict[str, Any]:
        if not query or len(query.split()) < 3:
            return {}

        try:
            results = await self.tavily_client.search(
                query,
                search_depth="basic",
                include_raw_content=False,
                max_results=10
            )
            
            docs = {}
            for result in results.get("results", []):
                if not result.get("content") or not result.get("url"):
                    continue
                    
                url = result.get("url")
                docs[url] = {
                    "title": result.get("title", ""),
                    "content": result.get("content", ""),
                    "query": query,
                    "url": url,
                    "source": "web_search",
                    "score": result.get("score", 0.0)
                }

            return docs
            
        except Exception as e:
            logger.error(f"Error searching query '{query}': {e}")
            return {}

    async def search_documents(self, queries: List[str]) -> Dict[str, Any]:
        if not queries:
            logger.error("No valid queries to search")
            return {}

        valid_queries = [q for q in queries if isinstance(q, str) and len(q.split()) >= 3]
        if not valid_queries:
            logger.error("No valid queries after filtering")
            return {}

        try:
            tasks = [self.search_single_query(q) for q in valid_queries]
            results = await asyncio.gather(*tasks)
            
            merged_docs = {}
            for result_dict in results:
                merged_docs.update(result_dict)

            if not merged_docs:
                logger.error("No documents found from any query")
            
            return merged_docs

        except Exception as e:
            logger.error(f"Error during document search: {e}")
            return {}