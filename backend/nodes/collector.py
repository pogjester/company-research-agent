from langchain_core.messages import AIMessage
from ..classes import ResearchState

class Collector:
    """Collects and organizes all research data before curation."""

    async def collect(self, state: ResearchState) -> ResearchState:
        """Collect and verify all research data is present."""
        company = state.get('company', 'Unknown Company')
        msg = [f"📦 Collecting research data for {company}:"]
        
        # Check each type of research data
        research_types = {
            'financial_data': '💰 Financial',
            'news_data': '📰 News',
            'industry_data': '🏭 Industry',
            'company_data': '🏢 Company'
        }
        
        all_present = True
        for data_field, label in research_types.items():
            data = state.get(data_field, {})
            if data:
                msg.append(f"• {label}: {len(data)} documents collected")
                raw_content_count = sum(1 for doc in data.values() if doc.get('raw_content'))
                msg.append(f"  ✓ {raw_content_count}/{len(data)} documents have raw content")
            else:
                msg.append(f"• {label}: No data found")
                all_present = False
        
        if not all_present:
            msg.append("\n⚠️ Warning: Some research data is missing")
        
        # Update state with collection message
        messages = state.get('messages', [])
        messages.append(AIMessage(content="\n".join(msg)))
        state['messages'] = messages
        
        return state

    async def run(self, state: ResearchState) -> ResearchState:
        return await self.collect(state) 