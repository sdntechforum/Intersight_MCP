import crypto from 'crypto';
import fetch from 'node-fetch';

export interface IntersightConfig {
  apiKeyId: string;
  apiSecretKey: string;
  baseUrl: string;
}

export class IntersightApiService {
  private config: IntersightConfig;

  constructor(config: IntersightConfig) {
    this.config = config;
  }

  /**
   * Generate Intersight API authentication signature
   * Supports both RSA and EC (ECDSA) keys
   */
  private generateAuthSignature(
    method: string,
    path: string,
    body: string,
    timestamp: string,
    host: string
  ): string {
    const targetHeader = `(request-target): ${method.toLowerCase()} ${path}`;
    const dateHeader = `date: ${timestamp}`;
    const hostHeader = `host: ${host}`;
    // For EC keys, always include digest (even if empty for GET requests)
    const emptyBodyHash = crypto.createHash('sha256').update('').digest('base64');
    const digestHeader = `digest: SHA-256=${body ? crypto.createHash('sha256').update(body).digest('base64') : emptyBodyHash}`;
    
    // Detect key type and use appropriate header list
    const keyType = this.config.apiSecretKey.includes('BEGIN EC') ? 'EC' : 'RSA';
    
    let signatureString: string;
    let headersList: string;
    
    if (keyType === 'EC') {
      // EC keys require host and digest in signed headers (always)
      signatureString = `${targetHeader}\n${hostHeader}\n${dateHeader}\n${digestHeader}`;
      headersList = '(request-target) host date digest';
    } else {
      // RSA keys - include digest only if there's a body
      if (body) {
        signatureString = `${targetHeader}\n${dateHeader}\n${digestHeader}`;
        headersList = '(request-target) date digest';
      } else {
        signatureString = `${targetHeader}\n${dateHeader}`;
        headersList = '(request-target) date';
      }
    }

    const algorithm = keyType === 'EC' ? 'SHA256' : 'RSA-SHA256';
    const headerAlgorithm = keyType === 'EC' ? 'hs2019' : 'rsa-sha256';

    const signature = crypto
      .createSign(algorithm)
      .update(signatureString)
      .sign(this.config.apiSecretKey, 'base64');

    return `Signature keyId="${this.config.apiKeyId}",algorithm="${headerAlgorithm}",headers="${headersList}",signature="${signature}"`;
  }

  /**
   * Make authenticated request to Intersight API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname + parsedUrl.search;
    const timestamp = new Date().toUTCString();
    const bodyString = body ? JSON.stringify(body) : '';

    const headers: Record<string, string> = {
      'Date': timestamp,
      'Host': parsedUrl.host,
      'Authorization': this.generateAuthSignature(method, path, bodyString, timestamp, parsedUrl.host),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Always include digest header (required for EC keys in Intersight API v3)
    const digestHash = bodyString 
      ? crypto.createHash('sha256').update(bodyString).digest('base64')
      : crypto.createHash('sha256').update('').digest('base64');
    headers['Digest'] = `SHA-256=${digestHash}`;

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Intersight API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Core API methods
  async get(endpoint: string): Promise<any> {
    return this.makeRequest('GET', endpoint);
  }

  async post(endpoint: string, body: any): Promise<any> {
    return this.makeRequest('POST', endpoint, body);
  }

  async patch(endpoint: string, body: any): Promise<any> {
    return this.makeRequest('PATCH', endpoint, body);
  }

  async delete(endpoint: string): Promise<any> {
    return this.makeRequest('DELETE', endpoint);
  }

  // Inventory & Discovery
  async listComputeServers(filter?: string): Promise<any> {
    const endpoint = filter 
      ? `/compute/PhysicalSummaries?$filter=${encodeURIComponent(filter)}`
      : '/compute/PhysicalSummaries';
    return this.get(endpoint);
  }

  async getServerDetails(moid: string): Promise<any> {
    return this.get(`/compute/PhysicalSummaries/${moid}`);
  }

  async listChassis(): Promise<any> {
    return this.get('/equipment/Chasses');
  }

  async listFabricInterconnects(): Promise<any> {
    return this.get('/network/Elements');
  }

  // Alarms & Monitoring
  async listAlarms(filter?: string): Promise<any> {
    const endpoint = filter
      ? `/cond/Alarms?$filter=${encodeURIComponent(filter)}`
      : '/cond/Alarms';
    return this.get(endpoint);
  }

  async acknowledgeAlarm(moid: string): Promise<any> {
    return this.patch(`/cond/Alarms/${moid}`, { Acknowledge: 'Acknowledge' });
  }

  // Policies
  async listPolicies(policyType: string): Promise<any> {
    return this.get(`/${policyType}`);
  }

  async getPolicy(policyType: string, moid: string): Promise<any> {
    return this.get(`/${policyType}/${moid}`);
  }

  async createPolicy(policyType: string, policyData: any): Promise<any> {
    return this.post(`/${policyType}`, policyData);
  }

  async updatePolicy(policyType: string, moid: string, policyData: any): Promise<any> {
    return this.patch(`/${policyType}/${moid}`, policyData);
  }

  async deletePolicy(policyType: string, moid: string): Promise<any> {
    return this.delete(`/${policyType}/${moid}`);
  }

  // Pools
  async listPools(poolType: string): Promise<any> {
    return this.get(`/${poolType}`);
  }

  async createPool(poolType: string, poolData: any): Promise<any> {
    return this.post(`/${poolType}`, poolData);
  }

  async updatePool(poolType: string, moid: string, poolData: any): Promise<any> {
    return this.patch(`/${poolType}/${moid}`, poolData);
  }

  // Profiles
  async listServerProfiles(): Promise<any> {
    return this.get('/server/Profiles');
  }

  async getServerProfile(moid: string): Promise<any> {
    return this.get(`/server/Profiles/${moid}`);
  }

  async createServerProfile(profileData: any): Promise<any> {
    return this.post('/server/Profiles', profileData);
  }

  async updateServerProfile(moid: string, profileData: any): Promise<any> {
    return this.patch(`/server/Profiles/${moid}`, profileData);
  }

  async deleteServerProfile(moid: string): Promise<any> {
    return this.delete(`/server/Profiles/${moid}`);
  }

  async deployServerProfile(moid: string, action: string): Promise<any> {
    return this.post(`/server/Profiles/${moid}/Deploy`, { Action: action });
  }

  // Attach policies to profiles
  async attachPolicyToProfile(profileMoid: string, policyMoid: string, policyType: string): Promise<any> {
    const policyReference = {
      ClassId: policyType,
      ObjectType: policyType,
      Moid: policyMoid
    };
    
    // Different policy types attach differently - this is a simplified example
    return this.patch(`/server/Profiles/${profileMoid}`, {
      PolicyBucket: [policyReference]
    });
  }

  // Search
  async searchResources(resourceType: string, filter?: string): Promise<any> {
    const endpoint = filter
      ? `/${resourceType}?$filter=${encodeURIComponent(filter)}`
      : `/${resourceType}`;
    return this.get(endpoint);
  }
}
