// ============================================
// SUPABASE PROJECT GENERATOR
// ============================================

import { getClaude } from '@/lib/claude/client';
import type { ProjectRequirements } from '@/types/database';

export interface SupabaseSchema {
  sql: string;
  tables: TableDefinition[];
  rlsPolicies: RLSPolicy[];
  functions: DatabaseFunction[];
  triggers: Trigger[];
  indexes: Index[];
}

export interface TableDefinition {
  name: string;
  description: string;
  columns: ColumnDefinition[];
  foreignKeys: ForeignKey[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  description: string;
}

export interface ForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface RLSPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  description: string;
}

export interface DatabaseFunction {
  name: string;
  arguments: string;
  returns: string;
  body: string;
  language: 'plpgsql' | 'sql';
  description: string;
}

export interface Trigger {
  name: string;
  table: string;
  timing: 'BEFORE' | 'AFTER';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  functionName: string;
}

export interface Index {
  name: string;
  table: string;
  columns: string[];
  isUnique: boolean;
}

export interface EdgeFunction {
  name: string;
  path: string;
  code: string;
  description: string;
}

export interface SupabaseProjectConfig {
  schema: SupabaseSchema;
  edgeFunctions: EdgeFunction[];
  storageRules: string;
  authConfig: {
    providers: string[];
    redirectUrls: string[];
    jwtExpiry: number;
  };
  realtimeEnabled: string[]; // Tables with realtime enabled
}

// ============================================
// GENERADOR DE SCHEMA
// ============================================

export async function generateSupabaseSchema(
  requirements: Partial<ProjectRequirements>
): Promise<SupabaseSchema> {
  const claude = getClaude();

  const prompt = `Based on these project requirements, generate a complete Supabase/PostgreSQL database schema:

Requirements:
${JSON.stringify(requirements, null, 2)}

Generate a comprehensive schema including:
1. All necessary tables with proper relationships
2. Row Level Security (RLS) policies for each table
3. Useful database functions (triggers, helpers)
4. Indexes for performance
5. ENUMs where appropriate

Return ONLY valid JSON (no markdown):
{
  "sql": "-- Complete SQL script here",
  "tables": [
    {
      "name": "table_name",
      "description": "What this table stores",
      "columns": [
        {
          "name": "column_name",
          "type": "uuid/text/integer/etc",
          "nullable": false,
          "defaultValue": "uuid_generate_v4()",
          "isPrimaryKey": true,
          "isUnique": false,
          "description": "Column purpose"
        }
      ],
      "foreignKeys": [
        {
          "column": "user_id",
          "referencesTable": "profiles",
          "referencesColumn": "id",
          "onDelete": "CASCADE"
        }
      ]
    }
  ],
  "rlsPolicies": [
    {
      "name": "Users can view own data",
      "table": "table_name",
      "operation": "SELECT",
      "using": "auth.uid() = user_id",
      "description": "Policy description"
    }
  ],
  "functions": [
    {
      "name": "function_name",
      "arguments": "param1 uuid, param2 text",
      "returns": "void",
      "body": "BEGIN ... END;",
      "language": "plpgsql",
      "description": "What this function does"
    }
  ],
  "triggers": [
    {
      "name": "trigger_name",
      "table": "table_name",
      "timing": "BEFORE",
      "event": "INSERT",
      "functionName": "function_name"
    }
  ],
  "indexes": [
    {
      "name": "idx_table_column",
      "table": "table_name",
      "columns": ["column1", "column2"],
      "isUnique": false
    }
  ]
}`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: 'You are a PostgreSQL and Supabase expert. Generate production-ready database schemas with proper security.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in response');
  }

  return JSON.parse(jsonMatch[0]) as SupabaseSchema;
}

// ============================================
// GENERADOR DE EDGE FUNCTIONS
// ============================================

export async function generateEdgeFunctions(
  requirements: Partial<ProjectRequirements>,
  schema: SupabaseSchema
): Promise<EdgeFunction[]> {
  const claude = getClaude();

  const prompt = `Based on these requirements and database schema, generate Supabase Edge Functions:

Requirements:
${JSON.stringify(requirements, null, 2)}

Database Tables:
${schema.tables.map((t) => t.name).join(', ')}

Generate Edge Functions for common operations like:
- Webhooks handlers
- Complex business logic
- Third-party API integrations
- Scheduled tasks (cron)
- Custom authentication flows

Return ONLY valid JSON array:
[
  {
    "name": "function-name",
    "path": "/function-name",
    "code": "// Deno TypeScript code\\nimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts'\\n...",
    "description": "What this function does"
  }
]`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: 'You are a Supabase Edge Functions expert. Generate production-ready Deno/TypeScript functions.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No response from Claude');
  }

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return []; // No functions needed
  }

  return JSON.parse(jsonMatch[0]) as EdgeFunction[];
}

// ============================================
// GENERADOR DE CONFIGURACIÓN COMPLETA
// ============================================

export async function generateSupabaseConfig(
  requirements: Partial<ProjectRequirements>
): Promise<SupabaseProjectConfig> {
  // Generate schema
  const schema = await generateSupabaseSchema(requirements);

  // Generate edge functions
  const edgeFunctions = await generateEdgeFunctions(requirements, schema);

  // Determine which tables need realtime
  const realtimeEnabled = schema.tables
    .filter((t) =>
      ['messages', 'notifications', 'comments', 'chat', 'updates'].some((keyword) =>
        t.name.toLowerCase().includes(keyword)
      )
    )
    .map((t) => t.name);

  // Generate storage rules based on requirements
  const storageRules = generateStorageRules(requirements);

  // Auth configuration
  const authConfig = {
    providers: determineAuthProviders(requirements),
    redirectUrls: ['http://localhost:3000/**', 'https://*.vercel.app/**'],
    jwtExpiry: 3600,
  };

  return {
    schema,
    edgeFunctions,
    storageRules,
    authConfig,
    realtimeEnabled,
  };
}

function generateStorageRules(requirements: Partial<ProjectRequirements>): string {
  return `-- Storage Bucket Policies

-- Public bucket for assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true);

-- Private bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('private', 'private', false);

-- Policy: Anyone can read public bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

-- Policy: Authenticated users can upload to private bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'private'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can only access their own files
CREATE POLICY "Users can access own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'private'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
`;
}

function determineAuthProviders(requirements: Partial<ProjectRequirements>): string[] {
  const providers = ['email']; // Always include email

  const tech = requirements.technical_requirements;
  if (!tech) return providers;

  // Add social providers based on project type
  if (requirements.project_type === 'saas' || requirements.project_type === 'web_app') {
    providers.push('google', 'github');
  }

  if (requirements.project_type === 'ecommerce') {
    providers.push('google');
  }

  return providers;
}

// ============================================
// GENERADOR DE TIPOS TYPESCRIPT
// ============================================

export function generateTypeScriptTypes(schema: SupabaseSchema): string {
  let types = `// Auto-generated Supabase Types
// Generated by Devvy

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

  for (const table of schema.tables) {
    types += `      ${table.name}: {\n`;
    types += `        Row: {\n`;

    for (const col of table.columns) {
      const tsType = postgresTypeToTS(col.type);
      const nullable = col.nullable ? ' | null' : '';
      types += `          ${col.name}: ${tsType}${nullable}\n`;
    }

    types += `        }\n`;
    types += `        Insert: {\n`;

    for (const col of table.columns) {
      const tsType = postgresTypeToTS(col.type);
      const optional = col.defaultValue || col.nullable ? '?' : '';
      types += `          ${col.name}${optional}: ${tsType}\n`;
    }

    types += `        }\n`;
    types += `        Update: {\n`;

    for (const col of table.columns) {
      const tsType = postgresTypeToTS(col.type);
      types += `          ${col.name}?: ${tsType}\n`;
    }

    types += `        }\n`;
    types += `      }\n`;
  }

  types += `    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
`;

  return types;
}

function postgresTypeToTS(pgType: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'string',
    text: 'string',
    varchar: 'string',
    char: 'string',
    integer: 'number',
    int: 'number',
    bigint: 'number',
    smallint: 'number',
    numeric: 'number',
    decimal: 'number',
    real: 'number',
    'double precision': 'number',
    boolean: 'boolean',
    bool: 'boolean',
    json: 'Json',
    jsonb: 'Json',
    timestamp: 'string',
    timestamptz: 'string',
    date: 'string',
    time: 'string',
    interval: 'string',
    bytea: 'string',
    inet: 'string',
    cidr: 'string',
    macaddr: 'string',
  };

  const lowerType = pgType.toLowerCase();

  // Check for arrays
  if (lowerType.endsWith('[]')) {
    const baseType = lowerType.slice(0, -2);
    return `${typeMap[baseType] || 'unknown'}[]`;
  }

  return typeMap[lowerType] || 'unknown';
}

// ============================================
// GENERADOR DE CLIENTE SUPABASE
// ============================================

export function generateSupabaseClient(projectUrl: string): string {
  return `import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role
export function getServiceClient() {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
`;
}

// ============================================
// GENERADOR DE SEED DATA
// ============================================

export async function generateSeedData(
  schema: SupabaseSchema,
  requirements: Partial<ProjectRequirements>
): Promise<string> {
  const claude = getClaude();

  const prompt = `Generate seed data SQL for development/testing based on this schema:

Tables: ${schema.tables.map((t) => t.name).join(', ')}

Project type: ${requirements.project_type}

Generate realistic sample data (5-10 rows per table) that:
1. Respects foreign key relationships
2. Uses realistic names, emails, etc.
3. Includes various states/statuses
4. Is useful for development testing

Return ONLY SQL INSERT statements (no markdown):`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: 'You are a database expert. Generate realistic seed data for development.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No response from Claude');
  }

  return textBlock.text;
}
