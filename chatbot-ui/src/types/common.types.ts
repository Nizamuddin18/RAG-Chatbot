export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  detail: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
