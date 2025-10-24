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

  async deletePool(poolType: string, moid: string): Promise<any> {
    return this.delete(`/${poolType}/${moid}`);
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

  // Telemetry & Metrics
  async getServerTelemetry(serverMoid: string, metricType?: string): Promise<any> {
    const server = await this.get(`/compute/PhysicalSummaries/${serverMoid}`);
    
    const telemetryData: any = {
      serverMoid,
      serverName: server.Name,
      model: server.Model,
      serial: server.Serial,
      operPowerState: server.OperPowerState,
      metrics: {}
    };

    if (!metricType || metricType === 'All' || metricType === 'CPU') {
      // Get processor information
      const processors = await this.get(`/processor/Units?$filter=RegisteredDevice/Moid eq '${server.RegisteredDevice?.Moid}'`);
      telemetryData.metrics.cpu = processors.Results?.map((p: any) => ({
        id: p.ProcessorId,
        model: p.Model,
        cores: p.NumCores,
        threads: p.NumThreads,
        speed: p.Speed,
        temperature: p.Temperature,
        operState: p.OperState
      }));
    }

    if (!metricType || metricType === 'All' || metricType === 'Memory') {
      // Get memory information
      const memory = await this.get(`/memory/Units?$filter=RegisteredDevice/Moid eq '${server.RegisteredDevice?.Moid}'`);
      telemetryData.metrics.memory = {
        totalCapacity: server.TotalMemory,
        units: memory.Results?.map((m: any) => ({
          id: m.MemoryId,
          capacity: m.Capacity,
          type: m.Type,
          speed: m.Speed,
          operState: m.OperState,
          temperature: m.Temperature
        }))
      };
    }

    if (!metricType || metricType === 'All' || metricType === 'Temperature') {
      // Temperature sensors
      telemetryData.metrics.temperature = {
        cpuTemperature: server.CpuTemperature,
        frontPanelTemp: server.FrontPanelTemp,
        rearPanelTemp: server.RearPanelTemp
      };
    }

    if (!metricType || metricType === 'All' || metricType === 'Power') {
      // Power statistics
      telemetryData.metrics.power = {
        allocatedPower: server.AllocatedPower,
        availablePower: server.AvailablePower,
        powerState: server.OperPowerState
      };
    }

    return telemetryData;
  }

  async getChassisTelemetry(chassisMoid: string): Promise<any> {
    const chassis = await this.get(`/equipment/Chasses/${chassisMoid}`);
    
    // Get fans
    const fans = await this.get(`/equipment/FanModules?$filter=Chassis/Moid eq '${chassisMoid}'`);
    
    // Get PSUs
    const psus = await this.get(`/equipment/Psus?$filter=Chassis/Moid eq '${chassisMoid}'`);

    return {
      chassisMoid,
      chassisId: chassis.ChassisId,
      model: chassis.Model,
      serial: chassis.Serial,
      operState: chassis.OperState,
      metrics: {
        power: {
          inputPower: chassis.InputPower,
          outputPower: chassis.OutputPower,
          powerSupplyUnits: psus.Results?.map((psu: any) => ({
            id: psu.PsuId,
            model: psu.Model,
            output: psu.Output,
            voltage: psu.Voltage,
            operState: psu.OperState
          }))
        },
        thermal: {
          temperature: chassis.Temperature,
          fanModules: fans.Results?.map((fan: any) => ({
            id: fan.ModuleId,
            operState: fan.OperState,
            fanCount: fan.FanCount,
            operSpeed: fan.OperSpeed
          }))
        }
      }
    };
  }

  async getAdapterTelemetry(adapterMoid: string): Promise<any> {
    const adapter = await this.get(`/adapter/Units/${adapterMoid}`);
    
    // Get adapter host interfaces
    const interfaces = await this.get(`/adapter/HostEthInterfaces?$filter=AdapterUnit/Moid eq '${adapterMoid}'`);

    return {
      adapterMoid,
      adapterId: adapter.AdapterId,
      model: adapter.Model,
      serial: adapter.Serial,
      operState: adapter.OperState,
      metrics: {
        interfaces: interfaces.Results?.map((iface: any) => ({
          name: iface.Name,
          macAddress: iface.MacAddress,
          operState: iface.OperState,
          adminState: iface.AdminState,
          linkState: iface.LinkState,
          linkSpeed: iface.LinkSpeed
        }))
      }
    };
  }

  async listProcessorUnits(filter?: string): Promise<any> {
    const endpoint = filter
      ? `/processor/Units?$filter=${encodeURIComponent(filter)}`
      : '/processor/Units';
    return this.get(endpoint);
  }

  async listMemoryUnits(filter?: string): Promise<any> {
    const endpoint = filter
      ? `/memory/Units?$filter=${encodeURIComponent(filter)}`
      : '/memory/Units';
    return this.get(endpoint);
  }

  async listStorageControllers(filter?: string): Promise<any> {
    const endpoint = filter
      ? `/storage/Controllers?$filter=${encodeURIComponent(filter)}`
      : '/storage/Controllers';
    return this.get(endpoint);
  }

  async listPhysicalDrives(filter?: string): Promise<any> {
    const endpoint = filter
      ? `/storage/PhysicalDisks?$filter=${encodeURIComponent(filter)}`
      : '/storage/PhysicalDisks';
    return this.get(endpoint);
  }

  async getPowerStatistics(moid: string, resourceType: string): Promise<any> {
    if (resourceType === 'server') {
      const server = await this.get(`/compute/PhysicalSummaries/${moid}`);
      return {
        moid,
        resourceType: 'server',
        name: server.Name,
        model: server.Model,
        power: {
          allocatedPower: server.AllocatedPower,
          availablePower: server.AvailablePower,
          powerState: server.OperPowerState,
          powerSupplyRedundancy: server.PsuRedundancy
        }
      };
    } else if (resourceType === 'chassis') {
      const chassis = await this.get(`/equipment/Chasses/${moid}`);
      const psus = await this.get(`/equipment/Psus?$filter=Chassis/Moid eq '${moid}'`);
      
      return {
        moid,
        resourceType: 'chassis',
        chassisId: chassis.ChassisId,
        model: chassis.Model,
        power: {
          inputPower: chassis.InputPower,
          outputPower: chassis.OutputPower,
          powerSupplyUnits: psus.Results?.map((psu: any) => ({
            id: psu.PsuId,
            model: psu.Model,
            output: psu.Output,
            voltage: psu.Voltage,
            operState: psu.OperState
          }))
        }
      };
    }
    throw new Error(`Unsupported resource type: ${resourceType}`);
  }

  async getThermalStatistics(moid: string, resourceType: string): Promise<any> {
    if (resourceType === 'server') {
      const server = await this.get(`/compute/PhysicalSummaries/${moid}`);
      
      return {
        moid,
        resourceType: 'server',
        name: server.Name,
        model: server.Model,
        thermal: {
          cpuTemperature: server.CpuTemperature,
          frontPanelTemp: server.FrontPanelTemp,
          rearPanelTemp: server.RearPanelTemp,
          ambientTemp: server.AmbientTemp
        }
      };
    } else if (resourceType === 'chassis') {
      const chassis = await this.get(`/equipment/Chasses/${moid}`);
      const fans = await this.get(`/equipment/FanModules?$filter=Chassis/Moid eq '${moid}'`);
      
      return {
        moid,
        resourceType: 'chassis',
        chassisId: chassis.ChassisId,
        model: chassis.Model,
        thermal: {
          temperature: chassis.Temperature,
          ambientTemp: chassis.AmbientTemp,
          fanModules: fans.Results?.map((fan: any) => ({
            id: fan.ModuleId,
            operState: fan.OperState,
            operSpeed: fan.OperSpeed,
            fanCount: fan.FanCount
          }))
        }
      };
    }
    throw new Error(`Unsupported resource type: ${resourceType}`);
  }

  async listFanModules(chassisMoid?: string): Promise<any> {
    const endpoint = chassisMoid
      ? `/equipment/FanModules?$filter=Chassis/Moid eq '${chassisMoid}'`
      : '/equipment/FanModules';
    return this.get(endpoint);
  }

  async listPsuUnits(chassisMoid?: string): Promise<any> {
    const endpoint = chassisMoid
      ? `/equipment/Psus?$filter=Chassis/Moid eq '${chassisMoid}'`
      : '/equipment/Psus';
    return this.get(endpoint);
  }
}
