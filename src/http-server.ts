import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { IntersightApiService } from './services/intersightApi.js';
import { loadConfig } from './utils/config.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize API Service
let apiService: IntersightApiService;

try {
  const config = loadConfig();
  apiService = new IntersightApiService(config);
  console.log('✅ Intersight API Service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize API Service:', error);
  process.exit(1);
}

// Define available tools (matching the MCP server implementation)
const tools: Tool[] = [
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
  // Add representative sample of the 199 tools - in production this would be the complete list
  {
    name: 'list_policies',
    description: 'List policies of a specific type',
    inputSchema: {
      type: 'object',
      properties: {
        policyType: {
          type: 'string',
          description: 'Policy type (e.g., "boot/PrecisionPolicies", "bios/Policies")',
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
];

// Tool execution function (mimics the MCP server's handleToolCall)
async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    // Inventory & Discovery
    case 'list_compute_servers':
      return apiService.listComputeServers(args.filter);
    
    case 'get_server_details':
      return apiService.getServerDetails(args.moid);
    
    case 'list_chassis':
      return apiService.listChassis();
    
    case 'list_fabric_interconnects':
      return apiService.listFabricInterconnects();

    // Alarms & Monitoring
    case 'list_alarms':
      return apiService.listAlarms(args.filter);
    
    case 'acknowledge_alarm':
      return apiService.acknowledgeAlarm(args.moid);

    // Policy Management
    case 'list_policies':
      return apiService.listPolicies(args.policyType);
    
    case 'get_policy':
      return apiService.getPolicy(args.policyType, args.moid);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.14',
    tools: tools.length,
    description: 'Intersight MCP HTTP Server - Sample Implementation'
  });
});

// API info endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    name: 'Intersight MCP Server',
    version: '1.0.14',
    description: 'HTTP API for Cisco Intersight MCP tools',
    totalTools: tools.length,
    note: 'This is a sample implementation with core tools. Full MCP server has 199 tools.',
    endpoints: {
      health: '/health',
      tools: '/api/tools',
      execute: '/api/execute',
      search: '/api/tools/search',
      batch: '/api/batch'
    },
    documentation: 'https://github.com/jim-coyne/Intersight_MCP'
  });
});

// List available tools
app.get('/api/tools', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      totalTools: tools.length,
      tools: tools.map((tool: Tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {}
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tools',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Execute a tool
app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const { tool, parameters = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required',
        usage: 'POST /api/execute with { "tool": "tool_name", "parameters": {...} }'
      });
    }

    // Check if tool exists
    const toolExists = tools.some(t => t.name === tool);
    if (!toolExists) {
      return res.status(400).json({
        success: false,
        error: `Unknown tool: ${tool}`,
        availableTools: tools.map(t => t.name)
      });
    }

    // Execute the tool
    const result = await executeTool(tool, parameters);
    
    res.json({
      success: true,
      tool: tool,
      parameters: parameters,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Tool execution failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Batch tool execution
app.post('/api/batch', async (req: Request, res: Response) => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        error: 'Operations must be an array',
        usage: 'POST /api/batch with { "operations": [{"tool": "tool_name", "parameters": {...}}, ...] }'
      });
    }

    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await executeTool(operation.tool, operation.parameters || {});
        results.push({
          success: true,
          tool: operation.tool,
          result: result
        });
      } catch (error) {
        results.push({
          success: false,
          tool: operation.tool,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    res.json({
      success: true,
      totalOperations: operations.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch execution failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Search tools by name or description
app.get('/api/tools/search', (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        usage: 'GET /api/tools/search?query=search_term'
      });
    }

    const searchTerm = (query as string).toLowerCase();
    
    const matchingTools = tools.filter((tool: Tool) => 
      tool.name.toLowerCase().includes(searchTerm) ||
      (tool.description && tool.description.toLowerCase().includes(searchTerm))
    );

    res.json({
      success: true,
      query: query,
      totalMatches: matchingTools.length,
      tools: matchingTools.map((tool: Tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {}
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get tool details
app.get('/api/tools/:toolName', (req: Request, res: Response) => {
  try {
    const { toolName } = req.params;
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Tool not found: ${toolName}`,
        availableTools: tools.map(t => t.name)
      });
    }

    res.json({
      success: true,
      tool: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {},
        required: tool.inputSchema?.required || []
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tool details',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Express error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/info', 
      'GET /api/tools',
      'GET /api/tools/:toolName',
      'GET /api/tools/search?query=term',
      'POST /api/execute',
      'POST /api/batch'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Intersight MCP HTTP Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 API info: http://localhost:${port}/api/info`);
  console.log(`🛠️  Tools list: http://localhost:${port}/api/tools`);
  console.log(`⚡ Ready to execute ${tools.length} Intersight tools via HTTP API`);
  console.log(`📝 Note: This is a sample implementation. Full MCP server has 199 tools.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📝 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📝 SIGINT received, shutting down gracefully');
  process.exit(0);
});