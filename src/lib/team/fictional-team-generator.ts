// Fictional Team Generator
// Generates a complete team (PM + 1 Sr + 4 Jr) for each paid project

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type { ProjectTeamMember, FictionalTeamRole, ProjectType } from '@/types/database';
import {
  PM_PROFILES,
  SENIOR_PROFILES,
  JUNIOR_PROFILES,
  ROLE_TITLES,
  generateAvatarUrl,
  getRandomItem,
  getRandomItems,
  getSpecializationsForProject,
  type TeamMemberProfile,
} from './team-names-pool';

// Supabase client for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface GeneratedTeamMember {
  display_name: string;
  avatar_url: string;
  role: FictionalTeamRole;
  title: string;
  specializations: string[];
  bio: string;
  internal_code: string;
}

export interface GenerateTeamOptions {
  projectId: string;
  projectType: ProjectType;
  projectName: string;
}

/**
 * Generate internal code for team member
 * Format: ROLE-YEAR-SEQUENCE (e.g., PM-2024-0001)
 */
async function generateInternalCode(role: FictionalTeamRole): Promise<string> {
  const supabase = getSupabase();
  const year = new Date().getFullYear();

  const prefixMap: Record<FictionalTeamRole, string> = {
    project_manager: 'PM',
    senior_developer: 'SR',
    junior_developer: 'JR',
  };

  const prefix = prefixMap[role];

  // Get count of existing members with this role this year
  const { count } = await supabase
    .from('project_team_members')
    .select('*', { count: 'exact', head: true })
    .like('internal_code', `${prefix}-${year}-%`);

  const sequence = ((count || 0) + 1).toString().padStart(4, '0');

  return `${prefix}-${year}-${sequence}`;
}

/**
 * Generate a single team member
 */
async function generateTeamMember(
  profile: TeamMemberProfile,
  role: FictionalTeamRole,
  specializations: string[]
): Promise<GeneratedTeamMember> {
  const internalCode = await generateInternalCode(role);

  return {
    display_name: profile.name,
    avatar_url: generateAvatarUrl(profile.avatarSeed),
    role,
    title: ROLE_TITLES[role],
    specializations,
    bio: profile.bio,
    internal_code: internalCode,
  };
}

/**
 * Generate a complete fictional team for a project
 * Returns: 1 PM + 1 Senior + 4 Juniors = 6 members
 */
export async function generateProjectTeam(
  options: GenerateTeamOptions
): Promise<GeneratedTeamMember[]> {
  const { projectType } = options;
  const specializations = getSpecializationsForProject(projectType);

  const team: GeneratedTeamMember[] = [];

  // 1. Select and generate Project Manager
  const pmProfile = getRandomItem(PM_PROFILES);
  const pm = await generateTeamMember(
    pmProfile,
    'project_manager',
    ['Project Management', 'Agile/Scrum', 'Client Communication']
  );
  team.push(pm);

  // 2. Select and generate Senior Developer
  const seniorProfile = getRandomItem(SENIOR_PROFILES);
  const senior = await generateTeamMember(
    seniorProfile,
    'senior_developer',
    getRandomItems(specializations, 4)
  );
  team.push(senior);

  // 3. Select and generate 4 Junior Developers
  const juniorProfiles = getRandomItems(JUNIOR_PROFILES, 4);
  for (const profile of juniorProfiles) {
    const junior = await generateTeamMember(
      profile,
      'junior_developer',
      getRandomItems(specializations, 3)
    );
    team.push(junior);
  }

  return team;
}

/**
 * Assign fictional team to a project and save to database
 */
export async function assignFictionalTeam(
  options: GenerateTeamOptions
): Promise<ProjectTeamMember[]> {
  const supabase = getSupabase();
  const { projectId } = options;

  // Check if team already exists for this project
  const { data: existingTeam } = await supabase
    .from('project_team_members')
    .select('*')
    .eq('project_id', projectId);

  if (existingTeam && existingTeam.length > 0) {
    logger.debug('Team already exists', { projectId });
    return existingTeam as ProjectTeamMember[];
  }

  // Generate new team
  const generatedTeam = await generateProjectTeam(options);

  // Insert team members
  const teamMembersToInsert = generatedTeam.map((member) => ({
    project_id: projectId,
    display_name: member.display_name,
    avatar_url: member.avatar_url,
    role: member.role,
    title: member.title,
    specializations: member.specializations,
    bio: member.bio,
    internal_code: member.internal_code,
    is_active: true,
  }));

  const { data: insertedTeam, error } = await supabase
    .from('project_team_members')
    .insert(teamMembersToInsert)
    .select();

  if (error) {
    logger.error('Error inserting team members', error, { projectId });
    throw new Error(`Failed to assign team: ${error.message}`);
  }

  logger.audit('team_assigned', { projectId, teamSize: insertedTeam?.length });

  return insertedTeam as ProjectTeamMember[];
}

/**
 * Get the fictional team for a project
 */
export async function getProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('project_team_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('role', { ascending: true });

  if (error) {
    logger.error('Error fetching project team', error, { projectId });
    throw new Error(`Failed to get project team: ${error.message}`);
  }

  return (data || []) as ProjectTeamMember[];
}

/**
 * Deactivate team for a project (when cancelled/completed)
 */
export async function deactivateProjectTeam(projectId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('project_team_members')
    .update({ is_active: false })
    .eq('project_id', projectId);

  if (error) {
    logger.error('Error deactivating team', error, { projectId });
    throw new Error(`Failed to deactivate team: ${error.message}`);
  }
}
