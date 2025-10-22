import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { IntersightApiService } from './services/intersightApi.js';
import { loadConfig } from './utils/config.js';

export class IntersightMCPServer {
  private server: Server;
  private apiService: IntersightApiService;

  constructor() {
    this.server = new Server(
      {
        name: 'intersight-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Load configuration and initialize API service
    const config = loadConfig();
    this.apiService = new IntersightApiService(config);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.handleToolCall(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      // Inventory & Discovery Tools
      {
        name: 'list_compute_servers',
        description: 'List all compute servers (blades and rack units) with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'OData filter expression (e.g., "OperPowerState eq \'on\'")',
            },
          },
        },
      },
      {
        name: 'get_server_details',
        description: 'Get detailed information about a specific server by MOID',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'Managed Object ID of the server',
            },
          },
          required: ['moid'],
        },
      },
      {
        name: 'list_chassis',
        description: 'List all equipment chassis',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_fabric_interconnects',
        description: 'List all fabric interconnects and network elements',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Alarms & Monitoring Tools
      {
        name: 'list_alarms',
        description: 'List active alarms with optional filtering by severity',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'OData filter expression (e.g., "Severity eq \'Critical\'")',
            },
          },
        },
      },
      {
        name: 'acknowledge_alarm',
        description: 'Acknowledge a specific alarm',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'MOID of the alarm to acknowledge',
            },
          },
          required: ['moid'],
        },
      },

      // Policy Management Tools
      {
        name: 'list_policies',
        description: 'List policies of a specific type',
        inputSchema: {
          type: 'object',
          properties: {
            policyType: {
              type: 'string',
              description: 'Policy type (e.g., "boot/PrecisionPolicies", "bios/Policies", "vnic/LanConnectivityPolicies")',
            },
          },
          required: ['policyType'],
        },
      },
      {
        name: 'get_policy',
        description: 'Get details of a specific policy',
        inputSchema: {
          type: 'object',
          properties: {
            policyType: {
              type: 'string',
              description: 'Policy type path',
            },
            moid: {
              type: 'string',
              description: 'MOID of the policy',
            },
          },
          required: ['policyType', 'moid'],
        },
      },
      {
        name: 'create_boot_policy',
        description: 'Create a new boot policy',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the boot policy',
            },
            description: {
              type: 'string',
              description: 'Description of the policy',
            },
            bootMode: {
              type: 'string',
              description: 'Boot mode: Uefi or Legacy',
              enum: ['Uefi', 'Legacy'],
            },
            secureBoot: {
              type: 'boolean',
              description: 'Enable UEFI secure boot',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'organizationMoid'],
        },
      },
      {
        name: 'create_bios_policy',
        description: 'Create a new BIOS policy',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the BIOS policy',
            },
            description: {
              type: 'string',
              description: 'Description of the policy',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'organizationMoid'],
        },
      },
      {
        name: 'create_network_policy',
        description: 'Create a new LAN connectivity policy',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the network policy',
            },
            description: {
              type: 'string',
              description: 'Description of the policy',
            },
            targetPlatform: {
              type: 'string',
              description: 'Target platform: FIAttached or Standalone',
              enum: ['FIAttached', 'Standalone'],
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'organizationMoid'],
        },
      },
      {
        name: 'update_policy',
        description: 'Update an existing policy',
        inputSchema: {
          type: 'object',
          properties: {
            policyType: {
              type: 'string',
              description: 'Policy type path',
            },
            moid: {
              type: 'string',
              description: 'MOID of the policy to update',
            },
            updates: {
              type: 'object',
              description: 'Policy updates as JSON object',
            },
          },
          required: ['policyType', 'moid', 'updates'],
        },
      },
      {
        name: 'delete_policy',
        description: 'Delete a policy',
        inputSchema: {
          type: 'object',
          properties: {
            policyType: {
              type: 'string',
              description: 'Policy type path',
            },
            moid: {
              type: 'string',
              description: 'MOID of the policy to delete',
            },
          },
          required: ['policyType', 'moid'],
        },
      },

      // Pool Management Tools
      {
        name: 'list_pools',
        description: 'List pools of a specific type',
        inputSchema: {
          type: 'object',
          properties: {
            poolType: {
              type: 'string',
              description: 'Pool type (e.g., "ippool/Pools", "macpool/Pools", "uuidpool/Pools", "fcpool/Pools")',
            },
          },
          required: ['poolType'],
        },
      },
      {
        name: 'create_ip_pool',
        description: 'Create a new IP pool',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the IP pool',
            },
            description: {
              type: 'string',
              description: 'Description of the pool',
            },
            ipBlockFrom: {
              type: 'string',
              description: 'Starting IP address',
            },
            ipBlockTo: {
              type: 'string',
              description: 'Ending IP address',
            },
            gateway: {
              type: 'string',
              description: 'Default gateway',
            },
            netmask: {
              type: 'string',
              description: 'Subnet mask',
            },
            primaryDns: {
              type: 'string',
              description: 'Primary DNS server',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'ipBlockFrom', 'ipBlockTo', 'gateway', 'netmask', 'organizationMoid'],
        },
      },
      {
        name: 'create_mac_pool',
        description: 'Create a new MAC pool',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the MAC pool',
            },
            description: {
              type: 'string',
              description: 'Description of the pool',
            },
            macBlockFrom: {
              type: 'string',
              description: 'Starting MAC address (e.g., "00:25:B5:00:00:00")',
            },
            macBlockTo: {
              type: 'string',
              description: 'Ending MAC address',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'macBlockFrom', 'macBlockTo', 'organizationMoid'],
        },
      },
      {
        name: 'create_uuid_pool',
        description: 'Create a new UUID pool',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the UUID pool',
            },
            description: {
              type: 'string',
              description: 'Description of the pool',
            },
            prefix: {
              type: 'string',
              description: 'UUID prefix',
            },
            uuidBlockFrom: {
              type: 'string',
              description: 'Starting UUID suffix',
            },
            uuidBlockTo: {
              type: 'string',
              description: 'Ending UUID suffix',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'prefix', 'uuidBlockFrom', 'uuidBlockTo', 'organizationMoid'],
        },
      },
      {
        name: 'create_wwnn_pool',
        description: 'Create a new WWNN pool for Fibre Channel',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the WWNN pool',
            },
            description: {
              type: 'string',
              description: 'Description of the pool',
            },
            wwnnBlockFrom: {
              type: 'string',
              description: 'Starting WWNN address',
            },
            wwnnBlockTo: {
              type: 'string',
              description: 'Ending WWNN address',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'wwnnBlockFrom', 'wwnnBlockTo', 'organizationMoid'],
        },
      },
      {
        name: 'create_wwpn_pool',
        description: 'Create a new WWPN pool for Fibre Channel',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the WWPN pool',
            },
            description: {
              type: 'string',
              description: 'Description of the pool',
            },
            wwpnBlockFrom: {
              type: 'string',
              description: 'Starting WWPN address',
            },
            wwpnBlockTo: {
              type: 'string',
              description: 'Ending WWPN address',
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'wwpnBlockFrom', 'wwpnBlockTo', 'organizationMoid'],
        },
      },
      {
        name: 'update_pool',
        description: 'Update an existing pool',
        inputSchema: {
          type: 'object',
          properties: {
            poolType: {
              type: 'string',
              description: 'Pool type path',
            },
            moid: {
              type: 'string',
              description: 'MOID of the pool to update',
            },
            updates: {
              type: 'object',
              description: 'Pool updates as JSON object',
            },
          },
          required: ['poolType', 'moid', 'updates'],
        },
      },

      // Profile Management Tools
      {
        name: 'list_server_profiles',
        description: 'List all server profiles',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_server_profile',
        description: 'Get details of a specific server profile',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'MOID of the server profile',
            },
          },
          required: ['moid'],
        },
      },
      {
        name: 'create_server_profile',
        description: 'Create a new server profile',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the server profile',
            },
            description: {
              type: 'string',
              description: 'Description of the profile',
            },
            targetPlatform: {
              type: 'string',
              description: 'Target platform: FIAttached or Standalone',
              enum: ['FIAttached', 'Standalone'],
            },
            organizationMoid: {
              type: 'string',
              description: 'Organization MOID',
            },
          },
          required: ['name', 'organizationMoid'],
        },
      },
      {
        name: 'attach_policy_to_profile',
        description: 'Attach a policy to a server profile',
        inputSchema: {
          type: 'object',
          properties: {
            profileMoid: {
              type: 'string',
              description: 'MOID of the server profile',
            },
            policyMoid: {
              type: 'string',
              description: 'MOID of the policy to attach',
            },
            policyType: {
              type: 'string',
              description: 'Policy type (e.g., "boot.PrecisionPolicy", "bios.Policy")',
            },
            policyField: {
              type: 'string',
              description: 'Profile field name (e.g., "BootPolicySettings", "BiosPolicy")',
            },
          },
          required: ['profileMoid', 'policyMoid', 'policyType', 'policyField'],
        },
      },
      {
        name: 'attach_pool_to_profile',
        description: 'Attach a pool to a server profile',
        inputSchema: {
          type: 'object',
          properties: {
            profileMoid: {
              type: 'string',
              description: 'MOID of the server profile',
            },
            poolMoid: {
              type: 'string',
              description: 'MOID of the pool to attach',
            },
            poolType: {
              type: 'string',
              description: 'Pool type (e.g., "uuidpool.Pool")',
            },
            poolField: {
              type: 'string',
              description: 'Profile field name (e.g., "UuidPool")',
            },
          },
          required: ['profileMoid', 'poolMoid', 'poolType', 'poolField'],
        },
      },
      {
        name: 'assign_server_to_profile',
        description: 'Assign a physical server to a profile',
        inputSchema: {
          type: 'object',
          properties: {
            profileMoid: {
              type: 'string',
              description: 'MOID of the server profile',
            },
            serverMoid: {
              type: 'string',
              description: 'MOID of the physical server',
            },
          },
          required: ['profileMoid', 'serverMoid'],
        },
      },
      {
        name: 'deploy_server_profile',
        description: 'Deploy or undeploy a server profile',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'MOID of the server profile',
            },
            action: {
              type: 'string',
              description: 'Deploy action: Deploy or Undeploy',
              enum: ['Deploy', 'Undeploy'],
            },
          },
          required: ['moid', 'action'],
        },
      },
      {
        name: 'update_server_profile',
        description: 'Update an existing server profile',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'MOID of the profile to update',
            },
            updates: {
              type: 'object',
              description: 'Profile updates as JSON object',
            },
          },
          required: ['moid', 'updates'],
        },
      },
      {
        name: 'delete_server_profile',
        description: 'Delete a server profile',
        inputSchema: {
          type: 'object',
          properties: {
            moid: {
              type: 'string',
              description: 'MOID of the profile to delete',
            },
          },
          required: ['moid'],
        },
      },

      // Search & Query Tools
      {
        name: 'search_resources',
        description: 'Search for resources by type with optional OData filters',
        inputSchema: {
          type: 'object',
          properties: {
            resourceType: {
              type: 'string',
              description: 'Resource type path (e.g., "compute/PhysicalSummaries", "server/Profiles")',
            },
            filter: {
              type: 'string',
              description: 'OData filter expression',
            },
          },
          required: ['resourceType'],
        },
      },
    ];
  }

  private async handleToolCall(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      // Inventory & Discovery
      case 'list_compute_servers':
        return this.apiService.listComputeServers(args.filter);
      
      case 'get_server_details':
        return this.apiService.getServerDetails(args.moid);
      
      case 'list_chassis':
        return this.apiService.listChassis();
      
      case 'list_fabric_interconnects':
        return this.apiService.listFabricInterconnects();

      // Alarms & Monitoring
      case 'list_alarms':
        return this.apiService.listAlarms(args.filter);
      
      case 'acknowledge_alarm':
        return this.apiService.acknowledgeAlarm(args.moid);

      // Policy Management
      case 'list_policies':
        return this.apiService.listPolicies(args.policyType);
      
      case 'get_policy':
        return this.apiService.getPolicy(args.policyType, args.moid);
      
      case 'create_boot_policy':
        return this.apiService.createPolicy('boot/PrecisionPolicies', {
          ObjectType: 'boot.PrecisionPolicy',
          Name: args.name,
          Description: args.description,
          ConfiguredBootMode: args.bootMode,
          EnforceUefiSecureBoot: args.secureBoot,
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_bios_policy':
        return this.apiService.createPolicy('bios/Policies', {
          ObjectType: 'bios.Policy',
          Name: args.name,
          Description: args.description,
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_network_policy':
        return this.apiService.createPolicy('vnic/LanConnectivityPolicies', {
          ObjectType: 'vnic.LanConnectivityPolicy',
          Name: args.name,
          Description: args.description,
          TargetPlatform: args.targetPlatform,
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'update_policy':
        return this.apiService.updatePolicy(args.policyType, args.moid, args.updates);
      
      case 'delete_policy':
        return this.apiService.deletePolicy(args.policyType, args.moid);

      // Pool Management
      case 'list_pools':
        return this.apiService.listPools(args.poolType);
      
      case 'create_ip_pool':
        return this.apiService.createPool('ippool/Pools', {
          ObjectType: 'ippool.Pool',
          Name: args.name,
          Description: args.description,
          IpV4Blocks: [{
            From: args.ipBlockFrom,
            To: args.ipBlockTo,
          }],
          IpV4Config: {
            Gateway: args.gateway,
            Netmask: args.netmask,
            PrimaryDns: args.primaryDns,
          },
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_mac_pool':
        return this.apiService.createPool('macpool/Pools', {
          ObjectType: 'macpool.Pool',
          Name: args.name,
          Description: args.description,
          MacBlocks: [{
            From: args.macBlockFrom,
            To: args.macBlockTo,
          }],
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_uuid_pool':
        return this.apiService.createPool('uuidpool/Pools', {
          ObjectType: 'uuidpool.Pool',
          Name: args.name,
          Description: args.description,
          Prefix: args.prefix,
          UuidSuffixBlocks: [{
            From: args.uuidBlockFrom,
            To: args.uuidBlockTo,
          }],
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_wwnn_pool':
        return this.apiService.createPool('fcpool/Pools', {
          ObjectType: 'fcpool.Pool',
          Name: args.name,
          Description: args.description,
          PoolPurpose: 'WWNN',
          IdBlocks: [{
            From: args.wwnnBlockFrom,
            To: args.wwnnBlockTo,
          }],
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'create_wwpn_pool':
        return this.apiService.createPool('fcpool/Pools', {
          ObjectType: 'fcpool.Pool',
          Name: args.name,
          Description: args.description,
          PoolPurpose: 'WWPN',
          IdBlocks: [{
            From: args.wwpnBlockFrom,
            To: args.wwpnBlockTo,
          }],
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'update_pool':
        return this.apiService.updatePool(args.poolType, args.moid, args.updates);

      // Profile Management
      case 'list_server_profiles':
        return this.apiService.listServerProfiles();
      
      case 'get_server_profile':
        return this.apiService.getServerProfile(args.moid);
      
      case 'create_server_profile':
        return this.apiService.createServerProfile({
          ObjectType: 'server.Profile',
          Name: args.name,
          Description: args.description,
          TargetPlatform: args.targetPlatform || 'FIAttached',
          Organization: {
            ClassId: 'mo.MoRef',
            ObjectType: 'organization.Organization',
            Moid: args.organizationMoid,
          },
        });
      
      case 'attach_policy_to_profile': {
        const updateData: Record<string, any> = {};
        updateData[args.policyField] = {
          ClassId: 'mo.MoRef',
          ObjectType: args.policyType,
          Moid: args.policyMoid,
        };
        return this.apiService.updateServerProfile(args.profileMoid, updateData);
      }
      
      case 'attach_pool_to_profile': {
        const updateData: Record<string, any> = {};
        updateData[args.poolField] = {
          ClassId: 'mo.MoRef',
          ObjectType: args.poolType,
          Moid: args.poolMoid,
        };
        return this.apiService.updateServerProfile(args.profileMoid, updateData);
      }
      
      case 'assign_server_to_profile':
        return this.apiService.updateServerProfile(args.profileMoid, {
          AssignedServer: {
            ClassId: 'mo.MoRef',
            ObjectType: 'compute.RackUnit',
            Moid: args.serverMoid,
          },
        });
      
      case 'deploy_server_profile':
        return this.apiService.deployServerProfile(args.moid, args.action);
      
      case 'update_server_profile':
        return this.apiService.updateServerProfile(args.moid, args.updates);
      
      case 'delete_server_profile':
        return this.apiService.deleteServerProfile(args.moid);

      // Search & Query
      case 'search_resources':
        return this.apiService.searchResources(args.resourceType, args.filter);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Intersight MCP Server running on stdio');
  }
}