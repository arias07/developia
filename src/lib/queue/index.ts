/**
 * Job Queue System - Main Export
 */

export {
  jobQueue,
  JobQueue,
  JobTypes,
  type Job,
  type JobStatus,
  type JobPriority,
  type CreateJobParams,
  type JobHandler,
  type JobType,
} from './job-queue';

export {
  registerProjectDevelopmentHandler,
  queueProjectDevelopment,
  type ProjectDevelopmentPayload,
  type ProjectDevelopmentResult,
} from './handlers/project-development';

// Initialize all handlers
import { registerProjectDevelopmentHandler } from './handlers/project-development';

let handlersInitialized = false;

export function initializeJobHandlers(): void {
  if (handlersInitialized) return;

  registerProjectDevelopmentHandler();
  // Add more handlers here as needed

  handlersInitialized = true;
}
