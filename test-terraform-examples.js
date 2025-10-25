// Test script for Terraform examples functionality

async function getTerraformExamples(module) {
  const baseUrl = 'https://api.github.com/repos/CiscoDevNet/intersight-terraform-modules/contents';
  
  try {
    // Fetch the root directory listing
    const response = await fetch(baseUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Intersight-MCP-Server'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const items = await response.json();
    
    // Get all directories (these are the Terraform modules)
    const modules = items.filter((item) => item.type === 'dir');
    
    if (!module) {
      // Return list of available modules
      return {
        message: 'Available Terraform modules for Cisco Intersight',
        repository: 'CiscoDevNet/intersight-terraform-modules',
        count: modules.length,
        modulesSample: modules.slice(0, 20).map((mod) => ({
          name: mod.name,
          url: mod.html_url
        }))
      };
    }

    // Find matching module directory
    const matchingModule = modules.find((mod) => 
      mod.name.toLowerCase() === module.toLowerCase() ||
      mod.name.toLowerCase().includes(module.toLowerCase())
    );

    if (!matchingModule) {
      return {
        message: `No Terraform module found for: ${module}`,
        suggestion: 'Use get_terraform_examples without a module to see all available modules',
        availableModules: modules.slice(0, 15).map((m) => m.name)
      };
    }

    // Fetch files in the matching module directory
    const moduleResponse = await fetch(matchingModule.url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Intersight-MCP-Server'
      }
    });

    if (!moduleResponse.ok) {
      throw new Error(`Failed to fetch module: ${moduleResponse.statusText}`);
    }

    const moduleFiles = await moduleResponse.json();
    
    // Get .tf files and README
    const tfFiles = moduleFiles.filter((file) => 
      file.type === 'file' && (file.name.endsWith('.tf') || file.name === 'README.md')
    );

    // Check for examples subdirectory
    const examplesDir = moduleFiles.find((item) => 
      item.type === 'dir' && item.name === 'examples'
    );

    let exampleFiles = [];
    if (examplesDir) {
      const examplesResponse = await fetch(examplesDir.url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Intersight-MCP-Server'
        }
      });

      if (examplesResponse.ok) {
        const examplesContent = await examplesResponse.json();
        exampleFiles = examplesContent.filter((file) => 
          file.type === 'file' && file.name.endsWith('.tf')
        );
      }
    }

    // Fetch content of first main .tf file
    const mainFile = tfFiles.find(f => f.name.endsWith('.tf'));
    let mainContent = null;
    if (mainFile) {
      const contentResponse = await fetch(mainFile.download_url);
      mainContent = await contentResponse.text();
    }

    // Fetch first example if exists
    let exampleContent = null;
    if (exampleFiles.length > 0) {
      const contentResponse = await fetch(exampleFiles[0].download_url);
      exampleContent = await contentResponse.text();
    }

    return {
      message: `Terraform module: ${matchingModule.name}`,
      moduleName: matchingModule.name,
      moduleUrl: matchingModule.html_url,
      tfFiles: tfFiles.map(f => f.name),
      exampleFiles: exampleFiles.map(f => f.name),
      mainFilePreview: mainContent ? mainContent.substring(0, 400) + '...' : 'No .tf files',
      examplePreview: exampleContent ? exampleContent.substring(0, 400) + '...' : 'No examples'
    };
  } catch (error) {
    return {
      error: 'Failed to fetch Terraform examples',
      details: error.message
    };
  }
}

// Test 1: List all modules
console.log('Test 1: Listing available Terraform modules...\n');
getTerraformExamples().then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 2: Get server profile module
  console.log('\n\nTest 2: Getting "profile" module details...\n');
  return getTerraformExamples('profile');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 3: Get policy module
  console.log('\n\nTest 3: Getting "policy" module details...\n');
  return getTerraformExamples('policy');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Error:', error);
});
