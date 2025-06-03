// Enhanced constants with better timeout values
export const APP_CONFIG = {
  name: 'PeddleNet',
  version: '1.0.0',
  maxConnections: 10,
  messageTimeout: 30000,
  scanTimeout: 10000,
  connectionTimeout: 20000, // Increased for server fallback
} as const;

export const QR_CONFIG = {
  size: 256,
  margin: 4,
  errorCorrectionLevel: 'M' as const,
} as const;

export const MESH_CONFIG = {
  maxHops: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
} as const;
