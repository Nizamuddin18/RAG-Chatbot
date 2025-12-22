export interface Document {
  filename: string;
  file_path: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface DocumentList {
  documents: Document[];
  total: number;
}

export interface DocumentUploadResponse extends Document {}
