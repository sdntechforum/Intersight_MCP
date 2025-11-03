# 🔧 Intersight MCP Server Tool Configuration

*Version 1.0.15 - Tool Configuration & Security Enhancement*

The Intersight MCP Server supports configurable tool sets to balance functionality with security and performance.

## 🎯 Configuration Modes

### 1. Core Mode (Default) - 65 Essential Tools

Safe, read-only tools for basic Intersight operations:

- ✅ Inventory & Discovery (8 tools)
- ✅ Monitoring & Alarms (3 tools)
- ✅ Policy Management (12 tools)
- ✅ Resource Pools (6 tools)
- ✅ Telemetry & Metrics (15 tools)
- ✅ Hardware & Firmware (8 tools)
- ✅ Fabric & Network (6 tools)
- ✅ Workflows & System (4 tools)
- ✅ Code Examples (3 tools)

### 2. All Tools Mode - 199+ Complete Toolset

Full CRUD operations including create, update, delete capabilities.

## 🚀 Quick Configuration

### Environment Variables (Recommended)

```bash
# Use core 65 tools (default)
export INTERSIGHT_TOOL_MODE=core

# Use all 199+ tools
export INTERSIGHT_TOOL_MODE=all

# Alternative: Enable all tools
export INTERSIGHT_ENABLE_ALL_TOOLS=true
```

### VS Code Configuration

```json
{
  "github.copilot.chat.mcp.servers": {
    "intersight-core": {
      "command": "node",
      "args": ["/Users/jicoyne/Intersight_MCP/build/index.js"],
      "env": {
        "INTERSIGHT_API_KEY_ID": "your-key-id",
        "INTERSIGHT_API_SECRET_KEY_PATH": "/path/to/SecretKey.txt",
        "INTERSIGHT_TOOL_MODE": "core"
      }
    },
    "intersight-full": {
      "command": "node",
      "args": ["/Users/jicoyne/Intersight_MCP/build/index.js"],
      "env": {
        "INTERSIGHT_API_KEY_ID": "your-key-id",
        "INTERSIGHT_API_SECRET_KEY_PATH": "/path/to/SecretKey.txt",
        "INTERSIGHT_TOOL_MODE": "all"
      }
    }
  }
}
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "intersight": {
      "command": "node",
      "args": ["/Users/jicoyne/Intersight_MCP/build/index.js"],
      "env": {
        "INTERSIGHT_API_KEY_ID": "your-key-id",
        "INTERSIGHT_API_SECRET_KEY_PATH": "/path/to/SecretKey.txt",
        "INTERSIGHT_TOOL_MODE": "core"
      }
    }
  }
}
```

## 📋 Configuration File (Advanced)

Create `intersight-mcp-server-config.json`:

```json
{
  "serverConfig": {
    "name": "intersight",
    "toolSelectionMode": "whitelist",
    "enableAllTools": false,
    "serverProfileFocus": false
  },
  "toolConfiguration": {
    "enabledTools": [
      "list_compute_servers",
      "get_server_details",
      "list_server_profiles",
      "get_server_profile"
    ],
    "disabledTools": [
      "create_*",
      "update_*",
      "delete_*"
    ]
  }
}
```

## 🔒 Security Benefits

### Core Mode (65 tools)

- ✅ **Read-only operations only**
- ✅ **No destructive actions**
- ✅ **Safer for exploration**
- ✅ **Faster tool discovery**
- ✅ **Focused functionality**

### All Tools Mode (199+ tools)

- ⚠️ **Full CRUD capabilities**
- ⚠️ **Can modify infrastructure**
- ⚠️ **Requires careful usage**
- ✅ **Complete automation power**

## 📊 Tool Categories in Core Mode

| Category | Count | Key Tools |
|----------|-------|-----------|
| **Inventory & Discovery** | 8 | `list_compute_servers`, `get_server_details` |
| **Monitoring** | 3 | `list_alarms`, `list_tam_advisories` |
| **Policy Management** | 12 | `list_policies`, `get_policy`, `list_server_profiles` |
| **Resource Pools** | 6 | `list_pools`, `list_ippool_blocks` |
| **Telemetry** | 15 | `get_server_telemetry`, `get_top_resources` |
| **Hardware** | 8 | `list_firmware_running`, `list_hcl_operating_systems` |
| **Network** | 6 | `list_fabric_vlans`, `list_fabric_port_channels` |
| **Workflows** | 4 | `list_workflows`, `list_top_systems` |
| **Examples** | 3 | `get_powershell_examples`, `get_python_examples` |

## 🎛️ Runtime Tool Information

The server logs configuration details:

```text
Intersight MCP Server: Exposing 65 of 199 tools
Tool mode: whitelist
Enable all tools: false
```

## 🛡️ Error Handling

When a disabled tool is called:

```text
Error: Tool 'create_server_profile' is not enabled in current configuration. 
Use INTERSIGHT_TOOL_MODE=all to enable all tools.
```

## 📈 Recommended Usage

### Development & Exploration

```bash
export INTERSIGHT_TOOL_MODE=core
```

### Production Automation

```bash
export INTERSIGHT_TOOL_MODE=all
```

### Mixed Environment

Configure two separate MCP servers with different names and tool modes.

## 🔧 Implementation Details

### Server-Side Configuration (Recommended)

The MCP server filters tools internally before exposing them to clients.

**✅ Advantages:**

- Centralized control
- Consistent tool exposure across all clients
- Security enforcement at the server level
- Reduced client complexity

**❌ Disadvantages:**

- Requires server modification
- Less flexibility for different client needs

### Configuration Loader

The server uses `loadMCPServerConfig()` to determine which tools to expose:

```typescript
export function loadMCPServerConfig(): MCPServerConfig {
  const configPath = process.env.INTERSIGHT_CONFIG_FILE || 
    './intersight-mcp-server-config.json';
  
  // Load from file or use defaults
  // Override with environment variables
  if (process.env.INTERSIGHT_TOOL_MODE === 'all') {
    config.serverConfig.enableAllTools = true;
    config.serverConfig.toolSelectionMode = 'all';
  }
  
  return config;
}
```

### Tool Filtering

Tools are filtered using `isToolEnabled()` function:

```typescript
export function isToolEnabled(toolName: string, config: MCPServerConfig): boolean {
  if (config.serverConfig.toolSelectionMode === 'all') {
    return true;
  }
  
  if (config.serverConfig.toolSelectionMode === 'whitelist') {
    return config.toolConfiguration.enabledTools.includes(toolName);
  }
  
  return false;
}
```

## 🎭 Client Behavior

When tools are filtered server-side:

**✅ What Clients See:**

- Only enabled tools in `list_tools` response
- Cleaner, focused tool interface
- Consistent behavior across clients
- Security enforced at server level

**❌ Disabled Tool Behavior:**

- Disabled tools not listed in `list_tools`
- Calls to disabled tools return error
- Clear error message: "Tool 'X' is not enabled"

## 📈 Benefits of Server-Side Configuration

1. **🔒 Security**: Dangerous operations disabled at source
2. **🎯 Focus**: Streamlined tool set for specific use cases
3. **⚡ Performance**: Reduced tool discovery overhead
4. **🧹 Simplicity**: Clients don't need to filter tools
5. **📋 Consistency**: Same tool set across all clients
6. **🛡️ Safety**: Read-only operations prevent accidents

## 💡 Recommendation

**Use server-side configuration with the optimized 65-tool whitelist as the default.** This provides:

- Maximum safety (no destructive operations)
- Optimal performance (focused tool set)
- Server profile management focus
- Easy client integration
- Centralized security control

The server can expose environment variables or configuration options for users who need the full 199-tool set for advanced scenarios.

## 🚀 Version 1.0.15 Features

- **Tool Configuration System**: Core vs All Tools modes
- **Enhanced Security**: Server-side filtering and runtime checks
- **Environment Variable Control**: Simple `INTERSIGHT_TOOL_MODE` setting
- **Flexible Deployment**: Multiple server instances with different tool sets
- **Comprehensive Documentation**: Setup guides and security recommendations
- **Tested Implementation**: Verified core mode safety and all tools functionality