export interface Document {
  filename: string;
  file_path: string;
  size_bytes: number;
  uploaded_at: string;
  indexed_in: string[];  // List of index names containing this document
}

export interface DocumentList {
  documents: Document[];
  total: number;
}

export interface DocumentUploadResponse extends Document {}
