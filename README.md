# Intersight MCP Server

An MCP (Model Context Protocol) server that enables GitHub Copilot in VS Code to interact with Cisco Intersight APIs. This server exposes Intersight operations as tools for LLM applications.

## Quick Start for VS Code

### Prerequisites
- Node.js 16+ installed
- VS Code with GitHub Copilot Chat
- Intersight API credentials (Key ID + Secret Key)

### 1. Build the Server

```bash
cd intersight-mcp-server
npm install
npm run build
```

### 2. Configure VS Code

1. Open VS Code Settings: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"

2. Add this configuration to your `settings.json`:

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

   Replace the placeholders:
   - `/path/to/intersight-mcp-server` with your project directory
   - `your-api-key-id` with your Intersight API Key ID
   - `/path/to/SecretKey.txt` with path to your RSA private key file

3. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"

### 3. Test in GitHub Copilot Chat

Open Copilot Chat and try:
- "List all my Intersight compute servers"
- "Show me all critical alarms"
- "Create a boot policy named 'WebServer'"
- "List all server profiles"

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

### Manage Policies
```
"List all my boot policies and which profiles use each one"
```

## API Credentials

You'll need Intersight API credentials to use this server:

1. **Get your API Key ID:**
   - Log in to your Intersight account
   - Go to Settings → API Keys
   - Note your API Key ID

2. **Get your Secret Key:**
   - Download the private key (PEM format) from the Intersight interface
   - Save it securely on your computer
   - Pass the path to the secret key via environment variable

3. **Store securely:**
   - Never commit credentials to version control
   - Use absolute paths to your secret key file
   - The `.gitignore` file excludes auth directories

## Running the Server Standalone

To run the server directly (without VS Code):

```bash
export INTERSIGHT_API_KEY_ID="your-api-key-id"
export INTERSIGHT_API_SECRET_KEY_PATH="/path/to/SecretKey.txt"
export INTERSIGHT_BASE_URL="https://intersight.com/api/v1"
npm start
```