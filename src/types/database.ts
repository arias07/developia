// Database Types for DevelopIA Platform

export type UserRole = 'client' | 'admin' | 'project_manager' | 'developer' | 'designer' | 'freelancer' | 'consultant';

export type ProjectStatus =
  | 'draft'           // Cliente está en el embudo
  | 'requirements'    // Definiendo requerimientos
  | 'quoted'          // Cotizado, esperando pago
  | 'paid'            // Pagado, en cola de desarrollo
  | 'in_progress'     // En desarrollo
  | 'review'          // En revisión con cliente
  | 'completed'       // Completado
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
