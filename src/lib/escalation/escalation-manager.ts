// Escalation Manager
// Handles AI failures and escalates to human team members

import { createClient } from '@supabase/supabase-js';
import { notifyEscalation } from '../notifications/multi-channel';
import type {
  Escalation,
  EscalationType,
  EscalationSeverity,
  EscalationStatus,
  FreelancerProfile,
  FreelancerTask,
} from '@/types/database';

// Supabase client for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface CreateEscalationParams {
  projectId: string;
  type: EscalationType;
  severity?: EscalationSeverity;
  errorMessage?: string;
  errorStack?: string;
  failedPhase?: string;
  aiAttempts?: number;
  contextData?: Record<string, unknown>;
}

export interface EscalationResult {
  escalation: Escalation;
  notified: {
    app: boolean;
    email: boolean;
    whatsApp: boolean;
  };
}

/**
 * Classify error severity based on error type and phase
 */
function classifyErrorSeverity(
  type: EscalationType,
  phase?: string,
  errorMessage?: string
): EscalationSeverity {
  // Critical: Complete failures that block the entire project
  if (type === 'technical_failure' && phase === 'generating_structure') {
    return 'critical';
  }

  // Critical: External service failures that prevent deployment
  if (type === 'external_api_failure' && (phase === 'deploying' || phase === 'creating_repository')) {
    return 'critical';
  }

  // High: Failures in important phases
  if (type === 'technical_failure' && ['generating_backend', 'generating_frontend'].includes(phase || '')) {
    return 'high';
  }

  // High: Timeouts usually indicate serious issues
  if (type === 'timeout') {
    return 'high';
  }

  // Medium: Quality issues or capacity limits
  if (type === 'quality_issue' || type === 'capacity_limit') {
    return 'medium';
  }

  // Low: Client requests or minor issues
  if (type === 'client_request') {
    return 'low';
  }

  // Check error message for severity indicators
  if (errorMessage) {
    const criticalKeywords = ['fatal', 'critical', 'crash', 'out of memory', 'authentication failed'];
    const highKeywords = ['failed', 'error', 'exception', 'timeout'];

    if (criticalKeywords.some(kw => errorMessage.toLowerCase().includes(kw))) {
      return 'critical';
    }
    if (highKeywords.some(kw => errorMessage.toLowerCase().includes(kw))) {
      return 'high';
    }
  }

  return 'medium';
}

/**
 * Get project details for notification
 */
async function getProjectDetails(projectId: string): Promise<{
  projectName: string;
  clientEmail: string;
} | null> {
  const supabase = getSupabase();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      name,
      profiles:client_id (email)
    `)
    .eq('id', projectId)
    .single();

  if (error || !project) {
    console.error('Error fetching project details:', error);
    return null;
  }

  // Handle both array and object format from Supabase relations
  const profiles = project.profiles as { email: string } | { email: string }[] | null;
  let clientEmail = 'unknown@email.com';

  if (profiles) {
    if (Array.isArray(profiles) && profiles.length > 0) {
      clientEmail = profiles[0].email;
    } else if (!Array.isArray(profiles)) {
      clientEmail = profiles.email;
    }
  }

  return {
    projectName: project.name,
    clientEmail,
  };
}

/**
 * EscalationManager class
 * Handles creation, notification, and management of escalations
 */
export class EscalationManager {
  /**
   * Handle a failure and create an escalation if needed
   */
  static async handleFailure(
    projectId: string,
    error: Error,
    phase: string,
    aiAttempts: number = 1
  ): Promise<EscalationResult | null> {
    // Determine escalation type based on error
    let type: EscalationType = 'technical_failure';

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      type = 'timeout';
    } else if (
      error.message.includes('GitHub') ||
      error.message.includes('Vercel') ||
      error.message.includes('Supabase')
    ) {
      type = 'external_api_failure';
    } else if (error.message.includes('capacity') || error.message.includes('limit')) {
      type = 'capacity_limit';
    }

    // Create the escalation
    return this.createEscalation({
      projectId,
      type,
      errorMessage: error.message,
      errorStack: error.stack,
      failedPhase: phase,
      aiAttempts,
      contextData: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
      },
    });
  }

  /**
   * Create a new escalation and notify appropriate channels
   */
  static async createEscalation(
    params: CreateEscalationParams
  ): Promise<EscalationResult | null> {
    const supabase = getSupabase();

    // Auto-classify severity if not provided
    const severity = params.severity ||
      classifyErrorSeverity(params.type, params.failedPhase, params.errorMessage);

    // Insert escalation
    const { data: escalation, error } = await supabase
      .from('escalations')
      .insert({
        project_id: params.projectId,
        type: params.type,
        severity,
        status: 'pending' as EscalationStatus,
        error_message: params.errorMessage,
        error_stack: params.errorStack,
        failed_phase: params.failedPhase,
        ai_attempts: params.aiAttempts || 1,
        context_data: params.contextData,
      })
      .select()
      .single();

    if (error || !escalation) {
      console.error('Error creating escalation:', error);
      return null;
    }

    // Get project details for notification
    const projectDetails = await getProjectDetails(params.projectId);

    if (!projectDetails) {
      console.error('Could not get project details for notification');
      return {
        escalation: escalation as Escalation,
        notified: { app: false, email: false, whatsApp: false },
      };
    }

    // Send multi-channel notification
    const notified = await notifyEscalation({
      escalation: escalation as Escalation,
      projectName: projectDetails.projectName,
      clientEmail: projectDetails.clientEmail,
    });

    // Update project status to failed
    await supabase
      .from('projects')
      .update({
        status: 'failed',
        metadata: {
          escalation_id: escalation.id,
          failed_at: new Date().toISOString(),
          failed_phase: params.failedPhase,
        },
      })
      .eq('id', params.projectId);

    console.log(`[Escalation] Created ${severity} escalation for project ${params.projectId}`);

    return {
      escalation: escalation as Escalation,
      notified,
    };
  }

  /**
   * Assign escalation to a human team member
   */
  static async assignToHuman(
    escalationId: string,
    assignedTo: string
  ): Promise<Escalation | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('escalations')
      .update({
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
        status: 'assigned' as EscalationStatus,
      })
      .eq('id', escalationId)
      .select()
      .single();

    if (error) {
      console.error('Error assigning escalation:', error);
      return null;
    }

    // Notify the assigned person
    await supabase.from('notifications').insert({
      user_id: assignedTo,
      title: 'Nueva escalación asignada',
      message: 'Se te ha asignado una escalación que requiere atención.',
      type: 'alert',
      data: { escalationId },
    });

    return data as Escalation;
  }

  /**
   * Update escalation status
   */
  static async updateStatus(
    escalationId: string,
    status: EscalationStatus,
    notes?: string
  ): Promise<Escalation | null> {
    const supabase = getSupabase();

    const updateData: Partial<Escalation> = { status };

    if (status === 'in_progress') {
      // Nothing extra needed
    } else if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolution_notes = notes;
    }

    const { data, error } = await supabase
      .from('escalations')
      .update(updateData)
      .eq('id', escalationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating escalation status:', error);
      return null;
    }

    return data as Escalation;
  }

  /**
   * Resolve an escalation
   */
  static async resolve(
    escalationId: string,
    resolvedBy: string,
    notes: string,
    resolutionData?: Record<string, unknown>
  ): Promise<Escalation | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('escalations')
      .update({
        status: 'resolved' as EscalationStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: notes,
        resolution_data: resolutionData,
      })
      .eq('id', escalationId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving escalation:', error);
      return null;
    }

    // Get project and update status
    const escalation = data as Escalation;
    await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', escalation.project_id);

    return escalation;
  }

  /**
   * Get pending escalations (for admin dashboard)
   */
  static async getPendingEscalations(): Promise<Escalation[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('escalation_dashboard')
      .select('*')
      .in('status', ['pending', 'assigned'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending escalations:', error);
      return [];
    }

    return data as Escalation[];
  }

  /**
   * Assign escalation to a freelancer and create a task
   */
  static async assignToFreelancer(
    escalationId: string,
    freelancerId: string,
    taskDetails: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      estimatedHours?: number;
      deadline?: string;
      hourlyRate?: number;
      fixedAmount?: number;
    }
  ): Promise<FreelancerTask | null> {
    const supabase = getSupabase();

    // Get escalation details
    const { data: escalation, error: escError } = await supabase
      .from('escalations')
      .select('*, project_id')
      .eq('id', escalationId)
      .single();

    if (escError || !escalation) {
      console.error('Error fetching escalation:', escError);
      return null;
    }

    // Get freelancer profile
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('id', freelancerId)
      .single();

    if (freelancerError || !freelancer) {
      console.error('Error fetching freelancer:', freelancerError);
      return null;
    }

    // Check if freelancer has an active assignment for this project
    let { data: assignment } = await supabase
      .from('freelancer_assignments')
      .select('id')
      .eq('freelancer_id', freelancerId)
      .eq('project_id', escalation.project_id)
      .eq('status', 'active')
      .single();

    // If no assignment exists, create one
    if (!assignment) {
      const { data: newAssignment, error: assignError } = await supabase
        .from('freelancer_assignments')
        .insert({
          freelancer_id: freelancerId,
          project_id: escalation.project_id,
          role: 'developer',
          status: 'active',
          hourly_rate: taskDetails.hourlyRate || freelancer.hourly_rate,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (assignError || !newAssignment) {
        console.error('Error creating assignment:', assignError);
        return null;
      }
      assignment = newAssignment;
    }

    // Create task from escalation
    const { data: task, error: taskError } = await supabase
      .from('freelancer_tasks')
      .insert({
        assignment_id: assignment!.id,
        freelancer_id: freelancerId,
        project_id: escalation.project_id,
        escalation_id: escalationId,
        title: taskDetails.title,
        description: taskDetails.description || escalation.error_message,
        type: 'bugfix',
        priority: taskDetails.priority || 'high',
        status: 'pending',
        estimated_hours: taskDetails.estimatedHours,
        hourly_rate: taskDetails.hourlyRate || freelancer.hourly_rate,
        fixed_amount: taskDetails.fixedAmount,
        deadline: taskDetails.deadline,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return null;
    }

    // Update escalation status
    await supabase
      .from('escalations')
      .update({
        status: 'assigned',
        assigned_to: freelancer.user_id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', escalationId);

    // Notify freelancer
    if (freelancer.user_id) {
      await supabase.from('notifications').insert({
        user_id: freelancer.user_id,
        title: 'Nueva tarea asignada',
        message: `Se te ha asignado la tarea: ${taskDetails.title}`,
        type: 'alert',
        data: { taskId: task.id, escalationId },
      });
    }

    console.log(`[Escalation] Assigned to freelancer ${freelancer.full_name} with task ${task.id}`);

    return task as FreelancerTask;
  }

  /**
   * Get available freelancers for assignment
   */
  static async getAvailableFreelancers(
    skills?: string[]
  ): Promise<FreelancerProfile[]> {
    const supabase = getSupabase();

    let query = supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('status', 'approved')
      .eq('availability', 'available')
      .order('average_rating', { ascending: false });

    if (skills && skills.length > 0) {
      query = query.overlaps('primary_skills', skills);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching available freelancers:', error);
      return [];
    }

    return data as FreelancerProfile[];
  }

  /**
   * Get escalation statistics
   */
  static async getStats(): Promise<{
    pending: number;
    assigned: number;
    inProgress: number;
    resolvedToday: number;
    avgResolutionTime: number;
  }> {
    const supabase = getSupabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, assigned, inProgress, resolvedToday] = await Promise.all([
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
      supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('escalations').select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', today.toISOString()),
    ]);

    return {
      pending: pending.count || 0,
      assigned: assigned.count || 0,
      inProgress: inProgress.count || 0,
      resolvedToday: resolvedToday.count || 0,
      avgResolutionTime: 0, // TODO: Calculate from resolved escalations
    };
  }
}

export default EscalationManager;
