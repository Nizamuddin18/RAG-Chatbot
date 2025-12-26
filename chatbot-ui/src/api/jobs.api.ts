import apiClient from './client';
import type { JobResponse } from '../types/index.types';

export const jobsApi = {
  // Get job status
  getStatus: async (jobId: string): Promise<JobResponse> => {
    const response = await apiClient.get<JobResponse>(`/jobs/${jobId}`);
    return response.data;
  },
};

export default jobsApi;
