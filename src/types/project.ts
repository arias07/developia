// ============================================
// PROJECT TYPES
// ============================================

export interface PRDDocument {
  projectName: string;
  projectDescription: string;
  problemStatement?: string;
  objectives: string[];
  targetAudience: string;
  coreFeatures: Array<{
    name: string;
    description: string;
  }>;
  secondaryFeatures?: Array<{
    name: string;
    description: string;
  }>;
  userStories?: Array<{
    persona: string;
    action: string;
    benefit: string;
  }>;
  technicalRequirements: string[];
  designGuidelines?: string;
  successMetrics?: string[];
  timeline?: {
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  budget?: {
    total: number;
    currency: string;
    breakdown?: Array<{
      item: string;
      amount: number;
    }>;
  };
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  startDate?: Date;
  endDate?: Date;
  deliverables?: string[];
}

export interface ProjectPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  type: 'initial' | 'milestone' | 'final';
  stripePaymentId?: string;
  stripeInvoiceUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  url?: string;
  createdAt: Date;
}

export interface ProjectDeployment {
  id: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  url?: string;
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}
