# Intersight MCP Server

An MCP (Model Context Protocol) server that enables LLMs to interact with Cisco Intersight APIs. This server exposes Intersight operations as tools for LLM applications.

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

1. Open VSCode Settings: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)" 

-or- Claude Desktop configuration file:

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

![Intersight Dashboard](image1.png)

## Features & Tools (53 Total)

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
- `delete_pool` - Delete resource pools

### 🌐 Network Configuration

- `create_vnic` - Create virtual network interface cards
- `create_vlan_group` - Create VLAN groups (Ethernet Network Group Policies)

### 📊 Telemetry & Monitoring

- `get_server_telemetry` - Get server metrics (CPU, Memory, Temperature, Power)
- `get_chassis_telemetry` - Get chassis telemetry (power, thermal, fans, PSUs)
- `get_adapter_telemetry` - Get network adapter statistics
- `list_processor_units` - List CPU inventory
- `list_memory_units` - List memory modules
- `list_storage_controllers` - List storage controllers
- `list_physical_drives` - List physical disks
- `get_power_statistics` - Get power metrics
- `get_thermal_statistics` - Get temperature data
- `list_fan_modules` - List fan modules
- `list_psu_units` - List power supply units

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

## Example Use Cases

### Monitor Infrastructure

```text
"Show me all servers that are powered on and have critical alarms"
```

![Intersight Dashboard](image2.png)

### Manage Policies

```text
"List all my boot policies and which profiles use each one"
```

![Intersight Dashboard](image3.png)

## Demo

Watch the Claude Desktop MCP integration in action:

![Claude Desktop MCP Demo](claude_desktop.gif)

## Version History

### Version 1.0.2 (Current)

**Released:** October 24, 2025

**Features Added:**

- ✅ **Telemetry & Monitoring (11 tools)**
  - `get_server_telemetry` - Comprehensive server metrics (CPU, Memory, Temperature, Power)
  - `get_chassis_telemetry` - Chassis-level telemetry (power, thermal, fans, PSUs)
  - `get_adapter_telemetry` - Network adapter interface statistics
  - `list_processor_units` - CPU inventory and status across infrastructure
  - `list_memory_units` - Memory module inventory
  - `list_storage_controllers` - Storage controller inventory
  - `list_physical_drives` - Physical disk inventory
  - `get_power_statistics` - Server and chassis power metrics
  - `get_thermal_statistics` - Temperature data for servers and chassis
  - `list_fan_modules` - Fan module inventory and status
  - `list_psu_units` - Power supply unit inventory
- ✅ **Pool Management**
  - `delete_pool` - Delete resource pools by type and MOID

**Improvements:**

- Enhanced error handling for telemetry data aggregation
- Added comprehensive hardware monitoring capabilities
- Full support for infrastructure health metrics

### Version 1.0.1

**Released:** October 2025

**Features Added:**

- ✅ **Network Configuration (2 tools)**
  - `create_vnic` - Create virtual network interface cards with full policy support
  - `create_vlan_group` - Create VLAN groups (Ethernet Network Group Policies)
- ✅ **Enhanced vNIC Creation**
  - Support for Ethernet Adapter Policy references
  - Support for QoS Policy references
  - Support for Ethernet Network Group Policy (VLAN groups)
  - Fabric placement (A/B)
  - MAC pool assignment
  - Failover configuration
  - CDN (Consistent Device Naming) support

**Improvements:**

- Fixed vNIC policy references to use proper ObjectType structures
- Added comprehensive policy validation for vNIC creation
- Support for both FI-Attached and Standalone network configurations

### Version 1.0.0

**Released:** October 2025

**Initial Release Features:**

- ✅ **Core Infrastructure (4 tools)**
  - Server inventory and discovery
  - Chassis and fabric interconnect management
  - Detailed server information retrieval
- ✅ **Alarm Management (2 tools)**
  - List and filter alarms by severity
  - Acknowledge alarms
- ✅ **Policy Management (8 tools)**
  - Boot policies (UEFI/Legacy)
  - BIOS policies
  - Network/LAN connectivity policies
  - Policy CRUD operations
- ✅ **Pool Management (7 tools)**
  - IP, MAC, UUID pool creation
  - WWNN/WWPN pool creation for Fibre Channel
  - Pool update operations
- ✅ **Server Profiles (9 tools)**
  - Profile lifecycle management
  - Policy and pool attachment
  - Server assignment and deployment
- ✅ **Advanced Search**
  - OData query support for all Intersight resources
- ✅ **MCP Integration**
  - VS Code GitHub Copilot support
  - Claude Desktop integration
  - Stdio-based Model Context Protocol server


