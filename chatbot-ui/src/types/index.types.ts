export interface Index {
  name: string;
  dimension: number;
  metric: string;
  total_vector_count: number;
  status: string;
}

export interface IndexCreate {
  index_name: string;
  dimension?: number;
  metric?: string;
}

export interface IndexList {
  indexes: Index[];
  total: number;
}

export interface IndexUpdateRequest {
  document_paths: string[];
}

// Job Types
export interface JobCreateResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobResponse {
  job_id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: Index | null;
  error: string | null;
}
