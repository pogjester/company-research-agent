from langchain_core.messages import AIMessage
from langchain_anthropic import ChatAnthropic
from typing import Dict, Any
from datetime import datetime
import os

from ..classes import ResearchState

class Editor:
    """Compiles individual briefings into a single cohesive document."""
    
    def __init__(self) -> None:
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
            
        self.llm = ChatAnthropic(
            model_name="claude-3-haiku-20240307",
            temperature=0,
            max_tokens=1024
        )

    async def edit_report(self, briefings: Dict[str, str], context: Dict[str, Any]) -> str:
        """Compile briefings into a single cohesive report."""
        company = context['company']
        
        sections = {
            'company': '🏢 Company Overview',
            'industry': '🏭 Industry Analysis',
            'financial': '💰 Financial Analysis',
            'news': '📰 Recent Developments'
        }
        
        # Prepare the briefings in a structured format
        formatted_briefings = []
        for category, section_title in sections.items():
            if content := briefings.get(category):
                formatted_briefings.append(f"{section_title}\n{'='*40}\n{content}\n")
        
        prompt = rf"""You are compiling a comprehensive research report about {company}.
I will provide you with four sections of research that have already been prepared.
Your task is to:
1. Review all sections and identify any redundant information
2. Ensure smooth transitions between sections
3. Maintain consistent formatting and style
4. Preserve the distinct focus of each section while removing repetition
5. Keep all factual information but improve clarity and flow
6. Ensure information is up to date and recent ({datetime.now().strftime("%Y-%m-%d")})

Here are the sections:

{formatted_briefings}

Please compile these into a single cohesive report that:
- Maintains the four distinct sections with their original headers
- Removes any redundant information between sections
- Ensures consistent style and formatting throughout
- Improves clarity and readability
- Uses bullet points for key information
- Preserves all important facts and insights
- Includes a list of URL citations at the end

Return the edited report with the same section structure but improved flow and clarity."""

        response = await self.llm.ainvoke(prompt)
        return response.content

    async def compile_briefings(self, state: ResearchState) -> ResearchState:
        """Compile all briefings into a final report."""
        company = state.get('company', 'Unknown Company')
        context = {
            "company": company,
            "industry": state.get('industry', 'Unknown'),
            "hq_location": state.get('hq_location', 'Unknown')
        }
        
        msg = [f"📑 Compiling final report for {company}..."]
        
        briefings = state.get('briefings', {})
        if not briefings:
            msg.append("\n⚠️ No briefings available to compile")
            state['report'] = None
        else:
            msg.append(f"\n• Found {len(briefings)} briefings to compile")
            compiled_report = await self.edit_report(briefings, context)
            state['report'] = compiled_report
            
            msg.append("\n✅ Report compilation complete")
            msg.append("\nFinal Report:")
            msg.append("=" * 80)
            msg.append(compiled_report)
            msg.append("=" * 80)
            
            # Print the compiled report for immediate visibility
            print(f"\n{'='*80}\n📊 Compiled Report for {company}:\n{'='*80}")
            print(compiled_report)
            print("=" * 80)
        
        # Update state with compilation message
        messages = state.get('messages', [])
        messages.append(AIMessage(content="\n".join(msg)))
        state['messages'] = messages
        
        return state

    async def run(self, state: ResearchState) -> ResearchState:
        return await self.compile_briefings(state) 