# Jobs API Examples

The Jobs API provides a simple way to send one-off messages to agents and wait for responses.

## Features

- **One-off messaging**: Create temporary channels for single interactions
- **Automatic cleanup**: Jobs are automatically cleaned up after expiration
- **Status tracking**: Poll job status or wait for completion
- **Timeout handling**: Configurable timeouts with automatic timeout detection
- **Metadata support**: Attach custom metadata to jobs

## Basic Usage

### Create a Job and Wait for Result

```typescript
import { ElizaClient, JobStatus } from '@elizaos/api-client';

const client = new ElizaClient({
  baseUrl: 'http://localhost:3000',
});

// Simple one-line usage
const result = await client.messaging.createAndWaitForJob({
  userId: 'user-uuid',
  content: 'What is the weather in New York?',
});

console.log(result.result?.message.content);
```

### Create Job with Custom Agent and Timeout

```typescript
const job = await client.messaging.createJob({
  agentId: 'specific-agent-uuid', // optional - uses first agent if omitted
  userId: 'user-uuid',
  content: 'Explain quantum computing',
  timeoutMs: 60000, // 60 seconds
  metadata: {
    source: 'api',
    priority: 'high',
  },
});

console.log(`Job created: ${job.jobId}`);
console.log(`Status: ${job.status}`);
console.log(`Expires at: ${new Date(job.expiresAt)}`);
```

### Poll Job Status Manually

```typescript
// Create job
const job = await client.messaging.createJob({
  userId: 'user-uuid',
  content: 'Calculate 2+2',
});

// Poll until completion
try {
  const result = await client.messaging.pollJob(
    job.jobId,
    1000, // Poll every 1 second
    30    // Max 30 attempts
  );
  
  console.log('Job completed!');
  console.log(result.result?.message.content);
  console.log(`Processing time: ${result.result?.processingTimeMs}ms`);
} catch (error) {
  console.error('Job failed:', error);
}
```

### Check Job Status

```typescript
const job = await client.messaging.getJob('job-uuid');

switch (job.status) {
  case JobStatus.PENDING:
    console.log('Job is waiting to be processed');
    break;
  case JobStatus.PROCESSING:
    console.log('Job is being processed by agent');
    break;
  case JobStatus.COMPLETED:
    console.log('Job completed:', job.result?.message.content);
    break;
  case JobStatus.FAILED:
    console.error('Job failed:', job.error);
    break;
  case JobStatus.TIMEOUT:
    console.error('Job timed out');
    break;
}
```

## Advanced Usage

### List All Jobs

```typescript
// List recent jobs
const { jobs, total, filtered } = await client.messaging.listJobs({
  limit: 10,
});

console.log(`Showing ${filtered} of ${total} jobs`);
jobs.forEach(job => {
  console.log(`${job.jobId}: ${job.status} - "${job.prompt}"`);
});
```

### Filter Jobs by Status

```typescript
// Get all completed jobs
const completed = await client.messaging.listJobs({
  status: JobStatus.COMPLETED,
  limit: 50,
});

console.log(`${completed.jobs.length} completed jobs`);
```

### Monitor Jobs Health

```typescript
const health = await client.messaging.getJobsHealth();

console.log(`Total jobs: ${health.totalJobs}/${health.maxJobs}`);
console.log('Status breakdown:');
console.log(`  Pending: ${health.statusCounts.pending}`);
console.log(`  Processing: ${health.statusCounts.processing}`);
console.log(`  Completed: ${health.statusCounts.completed}`);
console.log(`  Failed: ${health.statusCounts.failed}`);
console.log(`  Timeout: ${health.statusCounts.timeout}`);
```

### Error Handling

```typescript
import { ApiError, JobStatus } from '@elizaos/api-client';

try {
  const result = await client.messaging.createAndWaitForJob({
    userId: 'user-uuid',
    content: 'Process this task',
  });
  
  console.log('Success:', result.result?.message.content);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.statusCode}):`, error.message);
  } else {
    console.error('Error:', error);
  }
}
```

### Custom Polling Strategy

```typescript
async function pollJobWithCustomStrategy(jobId: string) {
  const maxWaitTime = 60000; // 1 minute total
  const startTime = Date.now();
  let pollInterval = 500; // Start with 500ms
  
  while (Date.now() - startTime < maxWaitTime) {
    const job = await client.messaging.getJob(jobId);
    
    if (job.status === JobStatus.COMPLETED) {
      return job;
    }
    
    if (job.status === JobStatus.FAILED || job.status === JobStatus.TIMEOUT) {
      throw new Error(`Job ${job.status}: ${job.error}`);
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, 5000); // Max 5 seconds
  }
  
  throw new Error('Polling timeout');
}
```

## Integration with Sessions API

You can use jobs for quick one-off interactions while maintaining longer sessions for ongoing conversations:

```typescript
// Quick one-off question
const quickResult = await client.messaging.createAndWaitForJob({
  userId: 'user-uuid',
  content: 'What is the time in Tokyo?',
});

// Ongoing conversation
const session = await client.sessions.createSession({
  userId: 'user-uuid',
  agentId: 'agent-uuid',
  metadata: { type: 'support' },
});

// Send multiple messages in the session
await client.sessions.sendMessageAndWait(session.sessionId, {
  content: 'I need help with my account',
});
```

## API Reference

### `createJob(params: CreateJobRequest): Promise<CreateJobResponse>`
Create a new job and start processing.

### `getJob(jobId: string): Promise<JobDetailsResponse>`
Get current status and details of a job.

### `listJobs(params?: ListJobsParams): Promise<ListJobsResponse>`
List all jobs with optional filtering.

### `getJobsHealth(): Promise<JobsHealthResponse>`
Get health status of the jobs service.

### `pollJob(jobId: string, interval?: number, maxAttempts?: number): Promise<JobDetailsResponse>`
Poll a job until completion or timeout.

### `createAndWaitForJob(params: CreateJobRequest, pollInterval?: number, maxAttempts?: number): Promise<JobDetailsResponse>`
Convenience method that creates a job and waits for completion.

## Type Definitions

```typescript
enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

interface CreateJobRequest {
  agentId?: UUID;           // Optional - uses first agent if not provided
  userId: UUID;             // User sending the message
  content: string;          // Message content/prompt
  metadata?: Record<string, unknown>;
  timeoutMs?: number;       // Default: 30000ms (30 seconds)
}

interface JobDetailsResponse {
  jobId: string;
  status: JobStatus;
  agentId: UUID;
  userId: UUID;
  prompt: string;
  createdAt: number;
  expiresAt: number;
  result?: JobResult;       // Available when COMPLETED
  error?: string;           // Available when FAILED
  metadata?: Record<string, unknown>;
}

interface JobResult {
  message: {
    id: string;
    content: string;
    authorId: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
  };
  processingTimeMs: number;
}
```

## Notes

- **x402 Payment Required**: This endpoint requires payment via the x402 protocol
  - Cost: $0.02 per request (0.02 USDC)
  - Supported networks: Base and Polygon
  - Payment verification: Uses Coinbase Facilitator
  - Include payment proof in `x-payment` header with transaction hash
  - Specify network in `x-payment-network` header (base or polygon)
- Jobs are automatically cleaned up after expiration
- Default timeout is 30 seconds, maximum is 5 minutes
- Jobs use temporary channels that are created and managed automatically
- The system maintains a maximum of 10,000 jobs in memory
- Jobs are ideal for stateless, one-off interactions
- For ongoing conversations, consider using the Sessions API instead

## x402 Payment Integration

The Jobs endpoint uses Coinbase's x402 protocol for onchain payments. To use this endpoint:

1. **Make initial request**: Send POST request to `/api/messaging/jobs`
2. **Receive 402 response**: If payment is required, you'll receive a 402 Payment Required response with payment details
3. **Make payment**: Submit 0.02 USDC payment on Base or Polygon network
4. **Retry with payment proof**: Include the transaction hash in the `x-payment` header and network in `x-payment-network` header

### Example Payment Flow

```typescript
// Initial request (may return 402)
const response = await fetch('https://api.example.com/api/messaging/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    content: 'Research topic: AI trends',
  }),
});

if (response.status === 402) {
  const paymentInfo = await response.json();
  // paymentInfo.payment contains network options and recipient address
  
  // Make payment (using x402-fetch or CDP wallet)
  const txHash = await makePayment({
    network: 'base',
    recipient: paymentInfo.payment[0].recipient,
    amount: paymentInfo.payment[0].amount,
  });
  
  // Retry with payment proof
  const job = await fetch('https://api.example.com/api/messaging/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payment': txHash,
      'x-payment-network': 'base',
    },
    body: JSON.stringify({
      userId: 'user-uuid',
      content: 'Research topic: AI trends',
    }),
  });
}
```

### Agent Capabilities

This endpoint provides access to AI agents with the following capabilities:
- Research and information gathering
- News analysis and summarization
- Data processing and analysis
- Content generation and summarization
- Question answering and knowledge retrieval

For more information about x402 protocol and registration, visit:
- [x402scan Registration](https://www.x402scan.com/resources/register)
- [x402 Documentation](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers)

