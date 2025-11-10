// Central export for all types
export * from './espn';
export * from './team';

// Additional shared types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface CacheMetadata {
  cachedAt: Date;
  expiresAt: Date;
  isStale: boolean;
}

export interface UpdateStatus {
  isUpdating: boolean;
  lastUpdate?: Date;
  nextUpdate?: Date;
  error?: string;
}
