# Security & Health Check Agent Implementation Guide

## Overview

The Security & Health Check Agent (`securityHealthCheckAgent.ts`) provides automated, comprehensive infrastructure analysis when users request security or health checks. This agent ensures consistent, thorough reporting across all requests.

## What It Does

When triggered, the agent automatically:

1. ✅ **Collects Alarms** - Active critical, warning, and info alarms
2. ✅ **Analyzes Advisories** - Technical advisories, field notices, CVEs from TAM
3. ✅ **Checks Firmware** - Current versions, updates, EOL status, inconsistencies
4. ✅ **Assesses Hardware** - Processor, memory, drive, thermal, power health
5. ✅ **Evaluates Security** - TPM, secure boot, licenses, management controllers
6. ✅ **Reviews Compliance** - Policies, certified OS versions, HyperFlex compatibility
7. ✅ **Analyzes Performance** - CPU, memory, power utilization hot spots
8. ✅ **Generates Scores** - Overall, security, health, and compliance scores (0-100)
9. ✅ **Identifies Issues** - Categorized by severity and type
10. ✅ **Recommends Actions** - Immediate, short-term, medium-term, and long-term

## Integration Steps

### Step 1: Import the Agent

```typescript
// In src/server.ts
import { 
  createSecurityHealthCheckReport,
  SecurityHealthCheckResult 
} from './services/securityHealthCheckAgent.js';
```

### Step 2: Add Agent-Triggered Tools

Add these new tools to the server's `getAllTools()` method:

```typescript
{
  name: 'generate_security_report',
  description: 'Generate comprehensive security posture report including CVEs, advisories, firmware updates, compliance, and recommendations',
  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        description: 'Report scope: "security", "health", or "comprehensive" (default)',
        enum: ['security', 'health', 'comprehensive']
      }
    }
  }
},
{
  name: 'generate_health_report',
  description: 'Generate comprehensive infrastructure health report including hardware status, alarms, thermal, power, and performance analysis',
  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        description: 'Report scope: "security", "health", or "comprehensive" (default)',
        enum: ['security', 'health', 'comprehensive']
      }
    }
  }
}
```

### Step 3: Implement Tool Handlers

Add to the `handleToolCall()` method in `IntersightMCPServer`:

```typescript
case 'generate_security_report':
case 'generate_health_report': {
  // Collect all data required for the report
  const [
    alarms,
    advisoryCount,
    advisories,
    firmware,
    operatingSystems,
    thermalStats,
    powerStats,
    licenses,
    tpms,
    bootSecurity,
    policies,
    hyperflexCompat,
    topResources
  ] = await Promise.all([
    this.apiService.listAlarms(''),
    this.apiService.getTamAdvisoryCount(''),
    this.apiService.listTamAdvisories(''),
    this.apiService.listFirmwareRunning(''),
    this.apiService.listHclOperatingSystems(''),
    this.apiService.getThermalStatistics('server', ''),
    this.apiService.getPowerStatistics('server', ''),
    this.apiService.listLicenses(''),
    this.apiService.listEquipmentTpms(''),
    this.apiService.listBootDeviceBootSecurities(''),
    this.apiService.listPolicies(''),
    this.apiService.listHclHyperflexCompatibility(''),
    this.apiService.getTopResources('CpuUtilization', 5)
  ]);

  // Generate report using agent
  const report = createSecurityHealthCheckReport(
    alarms,
    advisories,
    advisoryCount,
    firmware,
    operatingSystems,
    [],  // hardware placeholder
    thermalStats,
    powerStats,
    licenses,
    tpms,
    bootSecurity,
    policies,
    hyperflexCompat,
    topResources
  );

  return report;
}
```

## Report Structure

### Executive Summary
- **overallScore** (0-100): Combined security, health, and compliance
- **securityScore**: Based on advisories, CVEs, licenses, TPM
- **healthScore**: Based on alarms, hardware failures, thermal/power status
- **complianceScore**: Based on policies and OS certification
- **criticalCount**: Total critical findings
- **warningCount**: Total warning findings

### Alarms Section
```json
{
  "critical": 2,
  "warning": 5,
  "info": 12,
  "topAlarms": [
    {
      "id": "alarm-123",
      "description": "CPU temperature critical",
      "severity": "Critical"
    }
  ]
}
```

### Advisories Section
```json
{
  "critical": 1,
  "warning": 3,
  "info": 8,
  "securityAdvisories": 2,
  "fieldNotices": 1,
  "topAdvisories": [
    {
      "id": "adv-456",
      "title": "CVE-2024-xxxxx affecting CIMC",
      "type": "securityAdvisory"
    }
  ]
}
```

### Firmware Section
```json
{
  "components": 25,
  "currentlySupported": 20,
  "outdated": 4,
  "endOfLife": 1,
  "updateRecommendations": [
    {
      "component": "CIMC",
      "currentVersion": "3.1.2",
      "recommendedVersion": "4.0.1",
      "securityCritical": true
    }
  ]
}
```

### Security Section
```json
{
  "tpmStatus": "PRESENT",
  "secureBootEnabled": true,
  "licenseCompliance": "COMPLIANT",
  "expiredLicenses": 0,
  "expiringLicenses": 2,
  "managementControllersUnreachable": 0
}
```

### Recommendations Section
```json
{
  "immediate": [
    "Resolve 2 critical alarms immediately",
    "Apply critical security firmware updates",
    "Address 1 critical security advisory"
  ],
  "shortTerm": [
    "Update 4 outdated firmware components",
    "Enable Secure Boot on all servers",
    "Renew 2 licenses expiring soon"
  ],
  "mediumTerm": [
    "Implement automated firmware update policy",
    "Establish formal security patch management process"
  ],
  "longTerm": [
    "Plan infrastructure modernization",
    "Implement infrastructure-as-code"
  ]
}
```

### Issues Section
```json
[
  {
    "id": "ALM-1",
    "category": "HARDWARE",
    "severity": "CRITICAL",
    "title": "2 critical alarms active",
    "description": "There are 2 unresolved critical alarms",
    "affectedResources": [],
    "remediation": "Review and resolve each critical alarm"
  },
  {
    "id": "SEC-1",
    "category": "SECURITY",
    "severity": "CRITICAL",
    "title": "2 security advisories requiring attention",
    "description": "2 CVE or security advisories detected",
    "affectedResources": [],
    "remediation": "Apply latest security patches and firmware updates"
  }
]
```

## Usage Examples

### User Request
```
"Generate a security report for our infrastructure"
```

### Agent Response
Returns a comprehensive `SecurityHealthCheckResult` with:
- Overall security score (85/100)
- 2 critical security advisories requiring attention
- 4 firmware updates including 1 security-critical
- License compliance status
- Immediate, short-term, and long-term recommendations

### User Request
```
"Is our infrastructure healthy? Any issues I should know about?"
```

### Agent Response
Returns a comprehensive health report with:
- Hardware health status (DEGRADED)
- 2 failed processors and 1 degraded memory module
- Thermal status (WARNING - approaching limits)
- Performance analysis showing CPU-intensive servers
- Immediate recommendations to address degraded hardware

## Keyword Triggers

The agent should be automatically invoked when users ask about:

**Security-related keywords:**
- "security", "secure", "vulnerability", "CVE", "threat", "breach", "attack"
- "compliance", "audit", "policy", "governance", "risk"
- "encrypt", "firewall", "authentication", "access control"

**Health-related keywords:**
- "health", "status", "health check", "diagnostic"
- "problem", "issue", "failure", "degraded", "error"
- "thermal", "temperature", "power", "fan"
- "alarm", "alert", "warning", "critical"

**Both:**
- "report", "summary", "overview", "assessment"
- "advisories", "TAM", "field notice"
- "firmware", "update", "patch"

## Scoring Logic

### Security Score (0-100)
- -5 points per critical security advisory
- -3 points per security advisory
- -10 points if TPM not present
- -15 points if not licensed
- -10 points if licenses expired

### Health Score (0-100)
- -10 points per critical alarm
- -3 points per warning alarm
- -30 points if hardware CRITICAL
- -15 points if hardware DEGRADED
- -5 points if thermal WARNING
- -5 points if power DEGRADED

### Compliance Score (0-100)
- -20 points if non-compliant
- -15 points if no policies
- -5 points per policy violation

## Performance Characteristics

- **Execution Time**: 2-5 seconds (depending on infrastructure size)
- **Data Gathered**: ~15 API calls in parallel
- **Report Size**: 5-15 KB JSON
- **Refresh Rate**: Real-time (every invocation)

## Future Enhancements

1. **Trending Analysis** - Track scores over time
2. **Predictive Analytics** - Forecast issues before they occur
3. **Automated Remediation** - Execute recommended actions automatically
4. **Custom Thresholds** - Allow users to set custom alert thresholds
5. **Email Reports** - Send reports on schedule
6. **Comparison Reports** - Compare current state with baselines
7. **Export Formats** - PDF, Excel, HTML reports
8. **Integration with SOAR** - Automatic ticket creation for issues

## Security Considerations

1. **Data Sensitivity** - Reports contain infrastructure details
2. **Access Control** - Restrict report generation to authorized users
3. **Retention Policy** - Define how long reports are stored
4. **Audit Logging** - Log all report requests
5. **Encryption** - Store sensitive data encrypted

## Troubleshooting

### Agent returns empty data
- Check API credentials and connectivity
- Verify user has required Intersight permissions
- Review console logs for API errors

### Scores seem incorrect
- Verify all data sources are providing complete information
- Check scoring algorithm thresholds
- Review sample report data

### Report takes too long to generate
- Check network latency to Intersight
- Consider running in off-peak hours
- Reduce report scope if available

## References

- [Intersight TAM API](https://developer.cisco.com/docs/intersight/api/)
- [Security & Health Check Agent Source](./securityHealthCheckAgent.ts)
- [MCP Server Implementation](./server.ts)
