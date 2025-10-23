# Intersight MCP Server

An MCP (Model Context Protocol) server that enables LLMs to interact with Cisco Intersight APIs. This server exposes Intersight operations as tools for LLM applications.

## Quick Start for VS Code

### Prerequisites
- Node.js 16+ installed
- VSCode with GitHub Copilot or Claude Desktop
- Intersight API credentials (Key ID + Secret Key)

### 1. Build the Server

```bash
npm install
npm run build
```

### 2. Configure LLM Client

1. Open VSCode Settings: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)" -or- Claude Desktop configuration file:

   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`   

2. Add this configuration to your `settings.json` -or- `claude_desktop_config.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "intersight": {
      "command": "node",
      "args": ["/path/to/intersight-mcp-server/build/index.js"],
      "env": {
        "INTERSIGHT_API_KEY_ID": "your-api-key-id",
        "INTERSIGHT_API_SECRET_KEY_PATH": "/path/to/SecretKey.txt",
        "INTERSIGHT_BASE_URL": "https://intersight.com/api/v1"
      }
    }
  }
}
```

3. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window" -or- Restart Claude Desktop application.

### 3. Test in LLM Client

```
"Show me all critical alarms"
```

## Features & Tools (39 Total)

### 📦 Inventory & Discovery
- `list_compute_servers` - List all compute servers with optional filtering
- `get_server_details` - Get detailed information about a specific server
- `list_chassis` - List all equipment chassis
- `list_fabric_interconnects` - List fabric interconnects and network elements

### 🔔 Monitoring & Alarms
- `list_alarms` - List active alarms with severity filtering
- `acknowledge_alarm` - Acknowledge a specific alarm

### 📋 Policy Management
- `list_policies`, `get_policy` - Browse and retrieve policies
- `create_boot_policy` - Create boot policies (UEFI/Legacy mode)
- `create_bios_policy` - Create BIOS policies
- `create_network_policy` - Create LAN connectivity policies
- `update_policy`, `delete_policy` - Update or delete policies

### 🎯 Pool Management
- `list_pools` - Browse pools by type
- `create_ip_pool` - Create IP address pools
- `create_mac_pool` - Create MAC address pools
- `create_uuid_pool` - Create UUID pools
- `create_wwnn_pool` - Create WWNN pools for Fibre Channel
- `create_wwpn_pool` - Create WWPN pools for Fibre Channel
- `update_pool` - Modify existing pools

### 👥 Server Profiles
- `list_server_profiles` - Browse all profiles
- `get_server_profile` - Get profile details
- `create_server_profile` - Create new profiles
- `attach_policy_to_profile` - Attach policies to profiles
- `attach_pool_to_profile` - Attach pools to profiles
- `assign_server_to_profile` - Assign physical servers
- `deploy_server_profile` - Deploy or undeploy profiles
- `update_server_profile` - Modify profiles
- `delete_server_profile` - Remove profiles

### 🔍 Search & Query
- `search_resources` - Search any Intersight resource with OData filters

## Example Workflows

### Create a Complete Server Profile
```
"Create a new server profile called 'WebServer01':
1. Create a boot policy with UEFI mode
2. Create a UUID pool
3. Create the server profile
4. Attach the boot policy
5. Attach the UUID pool"
```

### Monitor Infrastructure
```
"Show me all servers that are powered on and have critical alarms"
```
![Intersight Dashboard](image2.png)

### Manage Policies
```
"List all my boot policies and which profiles use each one"
```

## Demo

Watch the Claude Desktop MCP integration in action:

![Claude Desktop MCP Demo](claude_desktop.mp4)
