import fs from 'fs';
import { IntersightConfig } from '../services/intersightApi.js';

export function loadConfig(): IntersightConfig {
  const apiKeyId = process.env.INTERSIGHT_API_KEY_ID;
  const apiSecretKeyPath = process.env.INTERSIGHT_API_SECRET_KEY_PATH;
  const apiSecretKey = process.env.INTERSIGHT_API_SECRET_KEY;
  const baseUrl = process.env.INTERSIGHT_BASE_URL || 'https://intersight.com/api/v1';

  if (!apiKeyId) {
    throw new Error('INTERSIGHT_API_KEY_ID environment variable is required');
  }

  let secretKey: string;
  
  if (apiSecretKeyPath) {
    // Load from file path
    try {
      secretKey = fs.readFileSync(apiSecretKeyPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read API secret key from ${apiSecretKeyPath}: ${error}`);
    }
  } else if (apiSecretKey) {
    // Use directly from environment variable
    secretKey = apiSecretKey;
  } else {
    throw new Error('Either INTERSIGHT_API_SECRET_KEY_PATH or INTERSIGHT_API_SECRET_KEY must be set');
  }

  return {
    apiKeyId,
    apiSecretKey: secretKey,
    baseUrl
  };
}
