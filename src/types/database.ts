// Database Types for Devvy Platform

export type UserRole = 'client' | 'admin' | 'project_manager' | 'developer' | 'designer' | 'freelancer' | 'consultant';

export type ProjectStatus =
  | 'draft'           // Cliente está en el embudo
  | 'requirements'    // Definiendo requerimientos
  | 'quoted'          // Cotizado, esperando pago
  | 'paid'            // Pagado, en cola de desarrollo
  | 'in_progress'     // En desarrollo
  | 'in_development'  // IA desarrollando autónomamente
  | 'deploying'       // Desplegando a producción
  | 'review'          // En revisión con cliente
  | 'completed'       // Completado
  | 'failed'          // Falló el desarrollo
  | 'cancelled';      // Cancelado

export type ProjectType =
  | 'landing_page'
  | 'website'
  | 'web_app'
  | 'mobile_app'
  | 'ecommerce'
  | 'saas'
  | 'api'
  | 'game'
  | 'custom';

export type ProjectComplexity = 'simple' | 'medium' | 'complex' | 'enterprise';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type ConsultationType = 'discovery' | 'technical' | 'design' | 'strategy' | 'support';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Main User Profile
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  company?: string;
  timezone: string;
  preferred_language: 'es' | 'en';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Projects
export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string;
  type: ProjectType;
  complexity: ProjectComplexity;
  status: ProjectStatus;

  // Requirements & Documentation
  requirements_json: ProjectRequirements;
  prd_document?: string;
  user_stories?: UserStory[];
  tech_stack?: string[];

  // Financials
  estimated_price: number;
  final_price?: number;
  currency: 'USD' | 'MXN';

  // Timeline
  estimated_duration_days: number;
  started_at?: string;
  completed_at?: string;
  deadline?: string;

  // Progress
  progress_percentage: number;
  current_phase: string;

  // AI Generation
  ai_generated: boolean;
  github_repo_url?: string;
  deployment_url?: string;

  // Team
  project_manager_id?: string;
  team_members?: string[];

  created_at: string;
  updated_at: string;
}

// Funnel/Requirements gathering
export interface ProjectRequirements {
  // Step 1: Basic Info
  project_name: string;
  project_description: string;
  project_type: ProjectType;

  // Step 2: Target & Goals
  target_audience: string;
  main_goals: string[];
  success_metrics: string[];

  // Step 3: Features
  core_features: Feature[];
  nice_to_have_features: Feature[];

  // Step 4: Design
  design_preferences: {
    style: 'modern' | 'classic' | 'minimalist' | 'bold' | 'custom';
    colors?: string[];
    inspirations?: string[];
    has_branding: boolean;
    branding_assets?: string[];
  };

  // Step 5: Technical
  technical_requirements: {
    platform: ('web' | 'ios' | 'android')[];
    integrations?: string[];
    authentication_needed: boolean;
    payment_processing: boolean;
    admin_panel: boolean;
    multi_language: boolean;
    seo_needed: boolean;
  };

  // Step 6: Timeline & Budget
  timeline_preference: 'asap' | 'flexible' | 'specific_date';
  specific_deadline?: string;
  budget_range: {
    min: number;
    max: number;
    currency: 'USD' | 'MXN';
  };

  // Additional
  additional_notes?: string;
  attachments?: Attachment[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  estimated_complexity: 'simple' | 'medium' | 'complex';
}

export interface UserStory {
  id: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: string[];
  priority: TaskPriority;
  estimated_points: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Payments
export interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  amount: number;
  currency: 'USD' | 'MXN';
  status: PaymentStatus;
  payment_type: 'full' | 'deposit' | 'milestone' | 'maintenance';
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  paid_at?: string;
  created_at: string;
}

// Milestones
export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string;
  order: number;
  status: TaskStatus;
  progress_percentage: number;
  due_date?: string;
  completed_at?: string;
  deliverables: string[];
  created_at: string;
}

// Tasks
export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours?: number;
  actual_hours?: number;
  ai_generated: boolean;
  github_issue_url?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

// Consultations/Appointments
export interface Consultation {
  id: string;
  client_id: string;
  consultant_id?: string;
  project_id?: string;
  type: ConsultationType;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
}

// Team Members (Internal)
export interface TeamMember {
  id: string;
  profile_id: string;
  role: UserRole;
  specializations: string[];
  hourly_rate?: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  current_projects: string[];
  max_concurrent_projects: number;
  rating: number;
  completed_projects_count: number;
  joined_at: string;
}

// Freelancer Applications
export interface FreelancerApplication {
  id: string;
  profile_id: string;
  portfolio_url: string;
  resume_url?: string;
  specializations: string[];
  years_experience: number;
  hourly_rate_expected: number;
  availability_hours_week: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
}

// Messages/Chat
export interface Message {
  id: string;
  project_id?: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  is_ai_generated: boolean;
  read_at?: string;
  created_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'project' | 'message' | 'consultation' | 'alert' | 'info';
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
  updated_at?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  user_id?: string;
  project_id?: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// Quotations
export interface Quotation {
  id: string;
  project_id: string;
  version: number;
  items: QuotationItem[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  currency: 'USD' | 'MXN';
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  created_at: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  category: 'development' | 'design' | 'consulting' | 'maintenance' | 'other';
}

// Subscription Plans (for maintenance)
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: 'USD' | 'MXN';
  features: string[];
  support_hours: number;
  updates_included: boolean;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  client_id: string;
  project_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  created_at: string;
}

// Development Metadata
export interface DevelopmentResult {
  success: boolean;
  generatedFiles: string[];
  errors: string[];
  completedAt: string;
}

export interface ProjectMetadata {
  development_result?: DevelopmentResult;
  development_error?: string;
  supabase_config?: {
    tables: string[];
    edgeFunctions: string[];
    realtimeEnabled: string[];
  };
  generated_at?: string;
}

// ============================================
// FICTIONAL TEAM MEMBERS (Shown to clients)
// ============================================

export type FictionalTeamRole = 'project_manager' | 'senior_developer' | 'junior_developer';

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  display_name: string;
  avatar_url?: string;
  role: FictionalTeamRole;
  title: string;
  specializations: string[];
  bio?: string;
  internal_code: string;
  assigned_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ESCALATION SYSTEM (AI failures -> Human)
// ============================================

export type EscalationType =
  | 'technical_failure'
  | 'capacity_limit'
  | 'quality_issue'
  | 'client_request'
  | 'timeout'
  | 'external_api_failure';

export type EscalationSeverity = 'critical' | 'high' | 'medium' | 'low';

export type EscalationStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export interface Escalation {
  id: string;
  project_id: string;
  type: EscalationType;
  severity: EscalationSeverity;
  status: EscalationStatus;
  error_message?: string;
  error_stack?: string;
  failed_phase?: string;
  ai_attempts: number;
  context_data?: Record<string, unknown>;
  assigned_to?: string;
  assigned_at?: string;
  resolution_notes?: string;
  resolution_data?: Record<string, unknown>;
  resolved_at?: string;
  resolved_by?: string;
  email_sent: boolean;
  whatsapp_sent: boolean;
  app_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface EscalationWithDetails extends Escalation {
  project_name: string;
  project_type: ProjectType;
  client_name: string;
  client_email: string;
  assigned_name?: string;
  assigned_email?: string;
}

// ============================================
// PROJECT ASSISTANTS (24/7 AI Support)
// ============================================

export interface ProjectAssistant {
  id: string;
  project_id: string;
  assistant_name: string;
  avatar_url?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  project_summary?: string;
  tech_stack?: Record<string, unknown>;
  features_list?: Array<{ name: string; description: string }>;
  architecture_overview?: string;
  known_issues?: Array<{ issue: string; workaround?: string }>;
  faq?: Array<{ question: string; answer: string }>;
  documentation_urls?: string[];
  codebase_summary?: string;
  api_endpoints?: Array<{ method: string; path: string; description: string }>;
  can_reset_passwords: boolean;
  can_clear_cache: boolean;
  can_restart_service: boolean;
  can_view_logs: boolean;
  can_health_check: boolean;
  vercel_project_id?: string;
  supabase_project_ref?: string;
  total_conversations: number;
  total_messages: number;
  total_actions_executed: number;
  last_interaction?: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: string;
    params?: Record<string, unknown>;
    result?: Record<string, unknown>;
    success?: boolean;
  };
}

export interface AssistantConversation {
  id: string;
  project_id: string;
  assistant_id: string;
  user_id: string;
  title?: string;
  messages: AssistantMessage[];
  started_at: string;
  last_message_at: string;
  message_count: number;
  topics_discussed: string[];
  actions_requested: string[];
  actions_executed: string[];
  satisfaction_rating?: number;
  feedback_text?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantActionLog {
  id: string;
  assistant_id: string;
  conversation_id?: string;
  user_id: string;
  action_type: string;
  action_params?: Record<string, unknown>;
  success: boolean;
  result_data?: Record<string, unknown>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

// Assistant allowed actions
export type AssistantActionType =
  | 'reset_password'
  | 'clear_cache'
  | 'restart_service'
  | 'view_logs'
  | 'health_check';

// ============================================
// FREELANCER SYSTEM
// ============================================

export type FreelancerStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';
export type FreelancerAvailability = 'available' | 'busy' | 'unavailable';
export type FreelancerApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'approved' | 'rejected';
export type FreelancerAssignmentStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
export type FreelancerTaskStatus = 'pending' | 'accepted' | 'in_progress' | 'review' | 'completed' | 'rejected' | 'cancelled';
export type FreelancerTaskType = 'development' | 'bugfix' | 'review' | 'design' | 'consultation' | 'other';
export type FreelancerPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type FreelancerTimeLogStatus = 'logged' | 'approved' | 'rejected' | 'paid';

export interface FreelancerProfile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  timezone: string;
  title?: string;
  bio?: string;
  years_experience: number;
  hourly_rate?: number;
  currency: string;
  primary_skills: string[];
  secondary_skills: string[];
  specializations: string[];
  languages: string[];
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  resume_url?: string;
  status: FreelancerStatus;
  availability: FreelancerAvailability;
  weekly_hours_available: number;
  total_projects_completed: number;
  total_tasks_completed: number;
  average_rating: number;
  total_reviews: number;
  total_earnings: number;
  internal_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FreelancerApplicationRecord {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  country?: string;
  city?: string;
  title?: string;
  bio?: string;
  years_experience?: number;
  expected_hourly_rate?: number;
  primary_skills: string[];
  secondary_skills: string[];
  specializations: string[];
  languages: string[];
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  resume_url?: string;
  cover_letter?: string;
  availability?: string;
  weekly_hours_available?: number;
  start_date?: string;
  referral_source?: string;
  referral_code?: string;
  status: FreelancerApplicationStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  interview_notes?: string;
  freelancer_id?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FreelancerAssignment {
  id: string;
  freelancer_id: string;
  project_id: string;
  role: string;
  assigned_team_member_id?: string;
  status: FreelancerAssignmentStatus;
  estimated_hours?: number;
  actual_hours: number;
  hourly_rate?: number;
  budget_cap?: number;
  started_at?: string;
  completed_at?: string;
  deadline?: string;
  assignment_notes?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  project?: Project;
}

export interface FreelancerTask {
  id: string;
  assignment_id: string;
  freelancer_id: string;
  project_id: string;
  escalation_id?: string;
  ticket_id?: string;
  milestone_id?: string;
  title: string;
  description?: string;
  type: FreelancerTaskType;
  priority: TaskPriority;
  status: FreelancerTaskStatus;
  estimated_hours?: number;
  actual_hours: number;
  fixed_amount?: number;
  hourly_rate?: number;
  total_paid: number;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  deadline?: string;
  deliverable_url?: string;
  deliverable_notes?: string;
  review_rating?: number;
  review_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  project?: Project;
  assignment?: FreelancerAssignment;
}

export interface FreelancerTimeLog {
  id: string;
  freelancer_id: string;
  task_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  description?: string;
  status: FreelancerTimeLogStatus;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface FreelancerPayment {
  id: string;
  freelancer_id: string;
  amount: number;
  currency: string;
  period_start?: string;
  period_end?: string;
  task_ids: string[];
  time_log_ids: string[];
  payment_method?: string;
  payment_reference?: string;
  status: FreelancerPaymentStatus;
  processed_by?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FreelancerReview {
  id: string;
  freelancer_id: string;
  project_id: string;
  reviewer_id: string;
  overall_rating: number;
  quality_rating?: number;
  communication_rating?: number;
  timeliness_rating?: number;
  title?: string;
  comment?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TEAM INVITES
// ============================================

export type TeamInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeamInvite {
  id: string;
  email: string;
  role: UserRole;
  specializations: string[];
  hourly_rate?: number;
  invite_token: string;
  status: TeamInviteStatus;
  invited_by?: string;
  accepted_by?: string;
  team_member_id?: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}
