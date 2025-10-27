import type { UUID } from '@elizaos/core';

/**
 * Job status enumeration
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * Request to create a new job
 */
export interface CreateJobRequest {
  /** Agent ID to send the message to (optional - uses first available agent if not provided) */
  agentId?: UUID;
  /** User ID sending the message */
  userId: UUID;
  /** Message content/prompt */
  content: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional timeout in milliseconds (default: 30000ms) */
  timeoutMs?: number;
}

/**
 * Response when creating a job
 */
export interface CreateJobResponse {
  /** Unique job identifier */
  jobId: string;
  /** Status of the job */
  status: JobStatus;
  /** Timestamp when job was created */
  createdAt: number;
  /** Estimated timeout time */
  expiresAt: number;
}

/**
 * Job result structure
 */
export interface JobResult {
  /** Agent's response message */
  message: {
    id: string;
    content: string;
    authorId: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
  };
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Job details response
 */
export interface JobDetailsResponse {
  /** Unique job identifier */
  jobId: string;
  /** Current status */
  status: JobStatus;
  /** Agent ID */
  agentId: UUID;
  /** User ID */
  userId: UUID;
  /** Original prompt/content */
  prompt: string;
  /** Timestamp when job was created */
  createdAt: number;
  /** Timestamp when job will expire */
  expiresAt: number;
  /** Result (only available when status is COMPLETED) */
  result?: JobResult;
  /** Error message (only available when status is FAILED) */
  error?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * List jobs response
 */
export interface ListJobsResponse {
  /** Array of job details */
  jobs: JobDetailsResponse[];
  /** Total number of jobs in system */
  total: number;
  /** Number of jobs returned after filtering */
  filtered: number;
}

/**
 * List jobs parameters
 */
export interface ListJobsParams {
  /** Maximum number of jobs to return */
  limit?: number;
  /** Filter by status */
  status?: JobStatus;
}

/**
 * Jobs health check response
 */
export interface JobsHealthResponse {
  /** Whether the jobs service is healthy */
  healthy: boolean;
  /** Current timestamp */
  timestamp: number;
  /** Total number of jobs in memory */
  totalJobs: number;
  /** Count of jobs by status */
  statusCounts: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    timeout: number;
  };
  /** Maximum number of jobs allowed in memory */
  maxJobs: number;
}

/**
 * Poll options for checking job status
 */
export interface PollOptions {
  /** Job ID to poll */
  jobId: string;
  /** Polling interval in milliseconds (default: 1000) */
  interval?: number;
  /** Maximum number of poll attempts (default: 30) */
  maxAttempts?: number;
  /** Total timeout in milliseconds (default: 30000) */
  timeout?: number;
}

