import { Agent, run, webSearchTool } from '@openai/agents';
import { Source, Category } from '@prisma/client';


type SourceWithCategory = Source & { category: Category };

function createNewsAgent(sources: SourceWithCategory[]): Agent {
  const sourceUrls = sources.map(s => s.url).join(', ');
  const categoryName = sources[0].category.name;

  const systemPrompt = `
You are an expert news curator for ${categoryName}.
Your task is to synthesize a single, cohesive news story from the most important recent articles found at the following URLs: ${sourceUrls}.

Follow these steps:
1. Visit each URL and identify the single most significant recent article from each source.
2. After reviewing all articles, create a single, compelling, and concise headline (max 20 words) that summarizes the overall news.
3. Write a short, engaging summary (3-4 sentences) that combines the key information from all articles into a single narrative.

IMPORTANT: Respond ONLY with a valid JSON object. Do not use markdown formatting, code blocks, or any other text. Your response must be parseable JSON in this exact format:
{
  "headline": "Your generated headline",
  "summary": "Your generated summary",
  "urls": ["url_from_source_1", "url_from_source_2", ...]
}
`;

  const agent = new Agent({
    name: `${categoryName} News Agent`,
    tools: [webSearchTool()],
    model: 'gpt-4.1-nano',
    instructions: systemPrompt,
  });

  return agent;
}

function extractJsonFromText(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const codeBlockMatches = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatches && codeBlockMatches[1]) {
      try {
        return JSON.parse(codeBlockMatches[1]);
      } catch (e2) {
        console.error('Failed to parse JSON from code block:', e2);
      }
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        console.error('Failed to parse JSON from match:', e3);
      }
    }
    
    const cleanedText = text.replace(/```json\s*/, '').replace(/\s*```/, '').trim();
    if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
      try {
        return JSON.parse(cleanedText);
      } catch (e4) {
        console.error('Failed to parse cleaned JSON:', e4);
      }
    }
    
    return null;
  }
}

export async function curateNews(sources: SourceWithCategory[]): Promise<{ headline: string; summary: string; urls: string[] } | null> {
  if (sources.length === 0) {
    return null;
  }

  try {
    const categoryName = sources[0].category.name;
    console.log(`Curating a synthesized story for ${categoryName} from ${sources.length} sources...`);
    const agent = createNewsAgent(sources);
    
    const result = await run(agent, `Synthesize the latest news from the provided sources for the ${categoryName} category.`);

    const finalOutput = result.finalOutput;
    console.log(`Raw agent output for ${categoryName}:`, finalOutput);

    if (typeof finalOutput === 'string') {
      const parsedContent = extractJsonFromText(finalOutput);
      
      if (parsedContent && parsedContent.headline && parsedContent.summary && parsedContent.urls) {
        console.log(`Successfully curated story for ${categoryName}:`, {
          headline: parsedContent.headline,
          summary: parsedContent.summary,
          urlCount: parsedContent.urls.length
        });
        
        return {
          headline: parsedContent.headline,
          summary: parsedContent.summary,
          urls: Array.isArray(parsedContent.urls) ? parsedContent.urls : [],
        };
      } else {
        console.error('Parsed content missing required fields:', parsedContent);
        return null;
      }
    }
    
    console.error('Agent output is not a string:', typeof finalOutput, finalOutput);
    return null;
  } catch (error) {
    console.error(`Error curating news for ${sources[0].category.name}:`, error);
    return null;
  }
}