import { getClaude } from './client';
import type { ProjectRequirements } from '@/types/database';

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface ProjectStructure {
  name: string;
  description: string;
  techStack: string[];
  files: GeneratedFile[];
  setupInstructions: string[];
  folderStructure: string;
}

export interface ComponentSpec {
  name: string;
  type: 'page' | 'component' | 'hook' | 'util' | 'api' | 'model';
  description: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  dependencies?: string[];
}

const SYSTEM_PROMPT = `You are Claude, an expert full-stack developer specializing in modern web development.
You write clean, maintainable, production-ready code following best practices.
You use TypeScript, React, Next.js, Tailwind CSS, and other modern technologies.
Always include proper error handling, type safety, and accessibility.
Generate code that is ready to use with minimal modifications.
Respond in the same language as the requirements (Spanish if Spanish, English if English).
IMPORTANT: Always respond with valid JSON only. No markdown code blocks, no explanations outside the JSON.`;

async function callClaude(prompt: string): Promise<string> {
  const claude = getClaude();

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

function extractJSON(text: string): string {
  // Try to extract JSON from the response
  // First, try to find JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // If no object found, try array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return text;
}

export async function generateProjectStructure(
  requirements: Partial<ProjectRequirements>
): Promise<ProjectStructure> {
  const prompt = `Based on the following project requirements, generate a complete project structure with initial files:

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Generate:
1. A recommended folder structure
2. Key starter files with actual code
3. Setup instructions

Return ONLY a JSON object (no markdown, no code blocks) with this structure:
{
  "name": "project-name",
  "description": "Brief description",
  "techStack": ["Next.js", "TypeScript", "Tailwind CSS"],
  "files": [
    {
      "path": "src/components/Example.tsx",
      "content": "// actual code here",
      "language": "typescript",
      "description": "What this file does"
    }
  ],
  "setupInstructions": ["npm install", "Configure .env"],
  "folderStructure": "ASCII tree representation"
}

Generate 5-10 essential starter files with real, working code.`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr) as ProjectStructure;
}

export async function generateComponent(
  spec: ComponentSpec,
  projectContext?: Partial<ProjectRequirements>
): Promise<GeneratedFile> {
  const prompt = `Generate a React/Next.js component based on this specification:

Component Spec:
${JSON.stringify(spec, null, 2)}

${projectContext ? `Project Context:\n${JSON.stringify(projectContext, null, 2)}` : ''}

Requirements:
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Include proper accessibility attributes
- Add JSDoc comments
- Handle loading and error states if applicable
- Make it responsive

Return ONLY a JSON object (no markdown, no code blocks):
{
  "path": "src/components/ComponentName.tsx",
  "content": "// Full component code",
  "language": "typescript",
  "description": "What this component does"
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr) as GeneratedFile;
}

export async function generateAPIEndpoint(
  endpoint: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    requestBody?: string;
    responseBody?: string;
  },
  projectContext?: Partial<ProjectRequirements>
): Promise<GeneratedFile> {
  const prompt = `Generate a Next.js API route based on this specification:

Endpoint:
${JSON.stringify(endpoint, null, 2)}

${projectContext ? `Project Context:\n${JSON.stringify(projectContext, null, 2)}` : ''}

Requirements:
- Use Next.js App Router API route format
- Include proper TypeScript types
- Add input validation
- Handle errors gracefully
- Include authentication check if needed
- Use Supabase for database operations

Return ONLY a JSON object (no markdown, no code blocks):
{
  "path": "src/app/api/..../route.ts",
  "content": "// Full API route code",
  "language": "typescript",
  "description": "What this endpoint does"
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr) as GeneratedFile;
}

export async function generateDatabaseSchema(
  requirements: Partial<ProjectRequirements>
): Promise<{
  sql: string;
  types: string;
  description: string;
}> {
  const prompt = `Based on the following project requirements, generate a Supabase/PostgreSQL database schema:

Project Requirements:
${JSON.stringify(requirements, null, 2)}

Generate:
1. SQL schema with tables, relationships, indexes, and RLS policies
2. TypeScript types for the schema
3. Brief description of the data model

Return ONLY a JSON object (no markdown, no code blocks):
{
  "sql": "-- SQL schema here",
  "types": "// TypeScript types here",
  "description": "Explanation of the data model"
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr);
}

export async function generateFromPrompt(
  prompt: string,
  context?: {
    projectRequirements?: Partial<ProjectRequirements>;
    existingFiles?: string[];
    techStack?: string[];
  }
): Promise<GeneratedFile[]> {
  const systemContext = context
    ? `
Project Context:
- Requirements: ${JSON.stringify(context.projectRequirements || {})}
- Existing files: ${context.existingFiles?.join(', ') || 'None'}
- Tech stack: ${context.techStack?.join(', ') || 'Next.js, TypeScript, Tailwind CSS'}
`
    : '';

  const fullPrompt = `${systemContext}

User Request: ${prompt}

Generate the requested code files. Return ONLY a JSON object (no markdown, no code blocks):
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "// Full file content",
      "language": "typescript",
      "description": "What this file does"
    }
  ]
}

Generate complete, working code that can be used directly.`;

  const response = await callClaude(fullPrompt);
  const jsonStr = extractJSON(response);
  const parsed = JSON.parse(jsonStr);
  return parsed.files as GeneratedFile[];
}

export async function refactorCode(
  code: string,
  instructions: string,
  language: string = 'typescript'
): Promise<{
  refactoredCode: string;
  changes: string[];
  explanation: string;
}> {
  const prompt = `Refactor the following ${language} code based on these instructions:

Instructions: ${instructions}

Original Code:
${code}

Return ONLY a JSON object (no markdown, no code blocks):
{
  "refactoredCode": "// Refactored code here",
  "changes": ["List of changes made"],
  "explanation": "Brief explanation of the refactoring"
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr);
}

export async function explainCode(
  code: string,
  language: string = 'typescript'
): Promise<{
  summary: string;
  lineByLine: Array<{
    lines: string;
    explanation: string;
  }>;
  suggestions: string[];
}> {
  const prompt = `Explain the following ${language} code in detail:

${code}

Return ONLY a JSON object (no markdown, no code blocks):
{
  "summary": "High-level summary of what the code does",
  "lineByLine": [
    {
      "lines": "1-5",
      "explanation": "What these lines do"
    }
  ],
  "suggestions": ["Improvement suggestions if any"]
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr);
}

export async function generateTests(
  code: string,
  testFramework: 'jest' | 'vitest' = 'vitest'
): Promise<GeneratedFile> {
  const prompt = `Generate comprehensive tests for the following code using ${testFramework}:

${code}

Requirements:
- Cover all main functions/components
- Include edge cases
- Use proper mocking where needed
- Add descriptive test names

Return ONLY a JSON object (no markdown, no code blocks):
{
  "path": "src/__tests__/filename.test.ts",
  "content": "// Test file content",
  "language": "typescript",
  "description": "Test coverage description"
}`;

  const response = await callClaude(prompt);
  const jsonStr = extractJSON(response);
  return JSON.parse(jsonStr) as GeneratedFile;
}

export async function chatWithClaude(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  context?: {
    projectRequirements?: Partial<ProjectRequirements>;
    currentFile?: string;
  }
): Promise<string> {
  const claude = getClaude();

  const systemPrompt = `You are Claude, an expert full-stack developer assistant.
You help developers with code, architecture decisions, debugging, and best practices.
Be concise but thorough. Use code examples when helpful.
${context?.projectRequirements ? `Project context: ${JSON.stringify(context.projectRequirements)}` : ''}
${context?.currentFile ? `Currently working on: ${context.currentFile}` : ''}`;

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}
