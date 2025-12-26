import jobsApi from '../api/jobs.api';
import type { JobResponse, Index } from '../types/index.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface JobPollingOptions {
  onProgress?: (progress: number, job: JobResponse) => void;
  onComplete?: (result: Index) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  maxAttempts?: number;
  useStreaming?: boolean; // Enable/disable SSE streaming
}

/**
 * Stream job status updates via Server-Sent Events (SSE)
 */
export const streamJobStatus = async (
  jobId: string,
  options: JobPollingOptions = {}
): Promise<Index | null> => {
  const {
    onProgress,
    onComplete,
    onError,
  } = options;

  return new Promise((resolve, reject) => {
    const streamUrl = `${API_BASE_URL}/jobs/${jobId}/stream`;
    console.log(`[SSE] Attempting to connect to: ${streamUrl}`);

    const eventSource = new EventSource(streamUrl);
    let completed = false;

    eventSource.onopen = () => {
      console.log(`[SSE] Connection opened for job ${jobId}`);
    };

    eventSource.onmessage = (event) => {
      console.log(`[SSE] Received message for job ${jobId}:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`[SSE] Parsed data for job ${jobId}:`, data);

        // Check for errors - only treat as error if error field has a value (not null/undefined)
        if (data.error !== null && data.error !== undefined) {
          eventSource.close();
          const errorMsg = data.error || 'Unknown error from server';
          console.error(`[SSE] Server sent error for job ${jobId}:`, {
            rawError: data.error,
            fullData: data,
            errorMsg: errorMsg
          });
          onError?.(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        const job: JobResponse = data;

        // Update progress
        onProgress?.(job.progress, job);

        // Check if completed
        if (job.status === 'completed') {
          eventSource.close();
          completed = true;
          if (job.result) {
            onComplete?.(job.result);
            resolve(job.result);
          } else {
            const errorMsg = 'Job completed but no result returned';
            onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        } else if (job.status === 'failed') {
          eventSource.close();
          completed = true;
          const errorMsg = job.error || 'Job failed with unknown error';
          onError?.(errorMsg);
          reject(new Error(errorMsg));
        }
      } catch (error) {
        eventSource.close();
        const errorMsg = error instanceof Error ? error.message : 'Failed to parse job update';
        onError?.(errorMsg);
        reject(error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`[SSE] Connection error for job ${jobId}:`, error);
      console.log(`[SSE] EventSource readyState:`, eventSource.readyState);
      eventSource.close();
      if (!completed) {
        const errorMsg = 'Stream connection failed';
        console.error(`[SSE] ${errorMsg}, falling back to polling`);
        onError?.(errorMsg);
        reject(new Error(errorMsg));
      }
    };

    // Cleanup timeout after 5 minutes
    setTimeout(() => {
      if (!completed) {
        eventSource.close();
        const errorMsg = 'Stream timeout after 5 minutes';
        onError?.(errorMsg);
        reject(new Error(errorMsg));
      }
    }, 300000); // 5 minutes
  });
};

/**
 * Poll a job until it completes, fails, or reaches max attempts
 * (Fallback method when streaming is not available)
 */
export const pollJobStatus = async (
  jobId: string,
  options: JobPollingOptions = {}
): Promise<Index | null> => {
  const {
    onProgress,
    onComplete,
    onError,
    pollInterval = 1000, // Poll every second
    maxAttempts = 300, // Max 5 minutes (300 seconds)
  } = options;

  let attempts = 0;

  const poll = async (): Promise<Index | null> => {
    try {
      attempts++;

      // Check if we've exceeded max attempts
      if (attempts > maxAttempts) {
        const errorMsg = 'Job polling timeout: maximum attempts reached';
        onError?.(errorMsg);
        throw new Error(errorMsg);
      }

      // Get job status
      const job = await jobsApi.getStatus(jobId);

      // Handle different statuses
      switch (job.status) {
        case 'pending':
        case 'running':
          // Update progress
          onProgress?.(job.progress, job);

          // Continue polling
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return poll();

        case 'completed':
          // Job completed successfully
          if (job.result) {
            onComplete?.(job.result);
            return job.result;
          } else {
            const errorMsg = 'Job completed but no result returned';
            onError?.(errorMsg);
            throw new Error(errorMsg);
          }

        case 'failed':
          // Job failed
          const errorMsg = job.error || 'Job failed with unknown error';
          onError?.(errorMsg);
          throw new Error(errorMsg);

        default:
          const unknownMsg = `Unknown job status: ${job.status}`;
          onError?.(unknownMsg);
          throw new Error(unknownMsg);
      }
    } catch (error) {
      // If error hasn't been reported yet, report it
      if (error instanceof Error) {
        onError?.(error.message);
      }
      throw error;
    }
  };

  return poll();
};

/**
 * Hook-friendly version that tries streaming first, falls back to polling
 * Returns a cancel function
 */
export const startJobPolling = (
  jobId: string,
  options: JobPollingOptions = {}
): (() => void) => {
  let cancelled = false;
  let fallbackActive = false; // Track if we're in fallback mode
  const useStreaming = options.useStreaming !== false; // Default true

  const wrappedOptions: JobPollingOptions = {
    ...options,
    onProgress: (progress, job) => {
      if (!cancelled) options.onProgress?.(progress, job);
    },
    onComplete: (result) => {
      if (!cancelled) options.onComplete?.(result);
    },
    onError: (error) => {
      if (!cancelled) options.onError?.(error);
    },
  };

  // Wrapped options for SSE that don't call onError (we'll fall back instead)
  const sseOptionsWithFallback: JobPollingOptions = {
    ...options,
    onProgress: (progress, job) => {
      if (!cancelled) options.onProgress?.(progress, job);
    },
    onComplete: (result) => {
      if (!cancelled) options.onComplete?.(result);
    },
    onError: (error) => {
      // Don't call the original onError - we're going to fall back to polling
      // Just log it for debugging
      console.log(`[JobPolling] SSE error (will fallback): ${error}`);
    },
  };

  // Try streaming first, fall back to polling on error
  if (useStreaming) {
    console.log(`[JobPolling] Trying SSE stream for job ${jobId}`);
    streamJobStatus(jobId, sseOptionsWithFallback).catch((streamError) => {
      // If not cancelled and stream failed, fall back to polling
      if (!cancelled && !fallbackActive) {
        fallbackActive = true;
        console.warn(`[JobPolling] Stream failed for job ${jobId}, falling back to polling:`, streamError.message);
        console.log(`[JobPolling] Progress bar will remain visible during polling`);

        // Fall back to polling with the original options (including onError)
        pollJobStatus(jobId, wrappedOptions).catch(() => {
          // Errors are handled in callbacks
        });
      }
    });
  } else {
    // Use polling directly
    console.log(`[JobPolling] Using polling for job ${jobId}`);
    pollJobStatus(jobId, wrappedOptions).catch(() => {
      // Errors are handled in callbacks
    });
  }

  // Return cancel function
  return () => {
    cancelled = true;
  };
};
