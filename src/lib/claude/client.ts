import Anthropic from '@anthropic-ai/sdk';

let claudeInstance: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (!claudeInstance) {
    claudeInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return claudeInstance;
}

export default getClaude;
