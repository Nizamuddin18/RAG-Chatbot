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
