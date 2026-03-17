export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  basePath?: string;
  skipAuth?: boolean;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  details?: unknown;
}

export type RequestOptions = {
  headers?: Record<string, string>;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  signal?: AbortSignal;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

export type InternalRequestOptions = RequestOptions & {
  method?: HttpMethod;
  body?: unknown;
};
