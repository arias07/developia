import openai from './client';
import type { ProjectRequirements } from '@/types/database';

export interface PRDDocument {
  title: string;
  executiveSummary: string;
  problemStatement: string;
  objectives: string[];
  targetAudience: {
    description: string;
    personas: Array<{
      name: string;
      description: string;
      needs: string[];
    }>;
  };
  scopeAndFeatures: {
    inScope: string[];
    outOfScope: string[];
    features: Array<{
      name: string;
      description: string;
      priority: 'must-have' | 'should-have' | 'nice-to-have';
      userStories: string[];
    }>;
  };
  technicalRequirements: {
    architecture: string;
    technologies: string[];
    integrations: string[];
    security: string[];
    performance: string[];
  };
  designRequirements: {
    style: string;
    brandGuidelines: string;
    uxPrinciples: string[];
    accessibility: string[];
  };
  timeline: {
    estimatedDuration: string;
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  successMetrics: Array<{
    metric: string;
    target: string;
  }>;
  risks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  assumptions: string[];
  constraints: string[];
}

export interface UserStory {
  id: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  storyPoints: number;
  epic?: string;
}

export interface TechnicalSpec {
  overview: string;
  systemArchitecture: {
    description: string;
    components: Array<{
      name: string;
      purpose: string;
      technologies: string[];
    }>;
    dataFlow: string;
  };
  database: {
    type: string;
    schema: Array<{
      table: string;
      purpose: string;
      fields: Array<{
        name: string;
        type: string;
        description: string;
      }>;
    }>;
  };
  api: {
    style: string;
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
      requestBody?: string;
      responseBody?: string;
    }>;
  };
  security: {
    authentication: string;
    authorization: string;
    dataProtection: string[];
  };
  deployment: {
    environment: string;
    infrastructure: string[];
    cicd: string;
  };
}

const SYSTEM_PROMPT = `You are an expert product manager and technical writer specializing in software development documentation.
You create professional, detailed, and actionable documentation that development teams can use directly.
Your documentation follows industry best practices and is structured for clarity and completeness.
Always respond in the same language as the project requirements (Spanish if the content is in Spanish).`;

export async function generatePRD(requirements: Partial<ProjectRequirements>): Promise<PRDDocument> {
  const prompt = `Based on the following project requirements, generate a comprehensive Product Requirements Document (PRD):

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Generate a complete PRD with all sections properly filled out. Return the response as a valid JSON object matching this structure:
{
  "title": "string",
  "executiveSummary": "string",
  "problemStatement": "string",
  "objectives": ["string"],
  "targetAudience": {
    "description": "string",
    "personas": [{"name": "string", "description": "string", "needs": ["string"]}]
  },
  "scopeAndFeatures": {
    "inScope": ["string"],
    "outOfScope": ["string"],
    "features": [{"name": "string", "description": "string", "priority": "must-have|should-have|nice-to-have", "userStories": ["string"]}]
  },
  "technicalRequirements": {
    "architecture": "string",
    "technologies": ["string"],
    "integrations": ["string"],
    "security": ["string"],
    "performance": ["string"]
  },
  "designRequirements": {
    "style": "string",
    "brandGuidelines": "string",
    "uxPrinciples": ["string"],
    "accessibility": ["string"]
  },
  "timeline": {
    "estimatedDuration": "string",
    "phases": [{"name": "string", "duration": "string", "deliverables": ["string"]}]
  },
  "successMetrics": [{"metric": "string", "target": "string"}],
  "risks": [{"risk": "string", "impact": "low|medium|high", "mitigation": "string"}],
  "assumptions": ["string"],
  "constraints": ["string"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content) as PRDDocument;
}

export async function generateUserStories(requirements: Partial<ProjectRequirements>): Promise<UserStory[]> {
  const prompt = `Based on the following project requirements, generate detailed user stories with acceptance criteria:

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Generate 10-15 user stories covering the main features. Return the response as a valid JSON object with a "stories" array:
{
  "stories": [
    {
      "id": "US-001",
      "title": "string",
      "asA": "string (role)",
      "iWant": "string (action)",
      "soThat": "string (benefit)",
      "acceptanceCriteria": ["string"],
      "priority": "must-have|should-have|nice-to-have",
      "storyPoints": number (1, 2, 3, 5, 8, or 13),
      "epic": "string (optional grouping)"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed.stories as UserStory[];
}

export async function generateTechnicalSpec(requirements: Partial<ProjectRequirements>): Promise<TechnicalSpec> {
  const prompt = `Based on the following project requirements, generate a detailed technical specification document:

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Generate a comprehensive technical specification. Return the response as a valid JSON object:
{
  "overview": "string",
  "systemArchitecture": {
    "description": "string",
    "components": [{"name": "string", "purpose": "string", "technologies": ["string"]}],
    "dataFlow": "string"
  },
  "database": {
    "type": "string (e.g., PostgreSQL, MongoDB)",
    "schema": [{"table": "string", "purpose": "string", "fields": [{"name": "string", "type": "string", "description": "string"}]}]
  },
  "api": {
    "style": "string (REST, GraphQL, etc.)",
    "endpoints": [{"method": "string", "path": "string", "description": "string", "requestBody": "string", "responseBody": "string"}]
  },
  "security": {
    "authentication": "string",
    "authorization": "string",
    "dataProtection": ["string"]
  },
  "deployment": {
    "environment": "string",
    "infrastructure": ["string"],
    "cicd": "string"
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content) as TechnicalSpec;
}

export async function generateQuotation(requirements: Partial<ProjectRequirements>): Promise<{
  estimatedHours: number;
  hourlyRate: number;
  totalCost: number;
  breakdown: Array<{
    phase: string;
    hours: number;
    cost: number;
    description: string;
  }>;
  timeline: string;
  notes: string[];
}> {
  const prompt = `Based on the following project requirements, generate a cost estimation and quotation:

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Consider:
- Project complexity
- Features requested
- Technical requirements
- Timeline constraints

Use an hourly rate of $75 USD for standard development.
Use $100 USD for senior/specialized work.
Use $50 USD for junior/simple tasks.

Return the response as a valid JSON object:
{
  "estimatedHours": number,
  "hourlyRate": number (average),
  "totalCost": number,
  "breakdown": [
    {
      "phase": "string",
      "hours": number,
      "cost": number,
      "description": "string"
    }
  ],
  "timeline": "string (estimated duration)",
  "notes": ["string (important considerations)"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

export async function refineRequirements(
  currentRequirements: Partial<ProjectRequirements>,
  userMessage: string
): Promise<{
  updatedRequirements: Partial<ProjectRequirements>;
  clarifyingQuestions: string[];
  suggestions: string[];
}> {
  const prompt = `You are helping a user refine their project requirements through conversation.

Current Requirements:
${JSON.stringify(currentRequirements, null, 2)}

User's message: "${userMessage}"

Analyze the user's message and:
1. Update the requirements based on their input
2. Generate any clarifying questions that would help better understand their needs
3. Provide helpful suggestions based on their project type

Return the response as a valid JSON object:
{
  "updatedRequirements": {
    // Updated ProjectRequirements object with any changes
  },
  "clarifyingQuestions": ["string"],
  "suggestions": ["string"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}
