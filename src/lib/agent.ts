import { Agent, run, webSearchTool } from '@openai/agents';
import { Source, Category } from '@prisma/client';

// This type is still useful for passing around source objects
type SourceWithCategory = Source & { category: Category };

/**
 * Creates a specialized news agent for a given category and its sources.
 * @param sources An array of news sources, including their URLs and category information.
 * @returns A configured Agent instance.
 */
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

Respond ONLY with a JSON object in the following format:
{
  "headline": "Your generated headline",
  "summary": "Your generated summary",
  "urls": ["url_from_source_1", "url_from_source_2", ...]
}
Do not include any other text or explanations in your response.
`;

  const agent = new Agent({
    name: `${categoryName} News Agent`,
    tools: [webSearchTool()],
    model: 'gpt-4.1-mini',
    instructions: systemPrompt,
  });

  return agent;
}

/**
 * Curates a single news post from multiple sources within a category.
 * @param sources The news sources to curate from.
 * @returns An object containing the headline, summary, and an array of URLs, or null if an error occurs.
 */
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

    if (typeof finalOutput === 'string') {
      const jsonMatch = finalOutput.match(/\{.*\}/);
      if (jsonMatch) {
        const parsedContent = JSON.parse(jsonMatch[0]);
        console.log(`Successfully curated story for ${categoryName}.`);
        return {
          headline: parsedContent.headline,
          summary: parsedContent.summary,
          urls: parsedContent.urls,
        };
      }
    }
    
    console.error('Failed to parse agent response for', categoryName, 'Received:', finalOutput);
    return null;
  } catch (error) {
    console.error(`Error curating news for ${sources[0].category.name}:`, error);
    return null;
  }
}