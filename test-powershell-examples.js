// Test script for PowerShell examples functionality

async function getPowerShellExamples(topic) {
  const baseUrl = 'https://api.github.com/repos/CiscoDevNet/intersight-powershell/contents/examples';
  
  try {
    // Fetch the examples directory listing
    const response = await fetch(baseUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Intersight-MCP-Server'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const directories = await response.json();
    
    // Get all subdirectories
    const subdirs = directories.filter((item) => item.type === 'dir');
    
    if (!topic) {
      // Return list of available example categories
      return {
        message: 'Available PowerShell example categories for Cisco Intersight',
        count: subdirs.length,
        categories: subdirs.slice(0, 15).map((dir) => ({
          name: dir.name,
          url: dir.html_url,
          description: `Examples for ${dir.name} operations`
        })),
        usage: 'Specify a topic (category name) to see examples in that category'
      };
    }

    // Find matching subdirectory
    const matchingDir = subdirs.find((dir) => 
      dir.name.toLowerCase() === topic.toLowerCase() ||
      dir.name.toLowerCase().includes(topic.toLowerCase())
    );

    if (!matchingDir) {
      return {
        message: `No category found for topic: ${topic}`,
        suggestion: 'Use get_powershell_examples without a topic to see all available categories',
        availableCategories: subdirs.slice(0, 10).map((d) => d.name)
      };
    }

    // Fetch files in the matching directory
    const dirResponse = await fetch(matchingDir.url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Intersight-MCP-Server'
      }
    });

    if (!dirResponse.ok) {
      throw new Error(`Failed to fetch directory: ${dirResponse.statusText}`);
    }

    const files = await dirResponse.json();
    const ps1Files = files.filter((file) => file.name.endsWith('.ps1'));

    if (ps1Files.length === 0) {
      return {
        message: `No PowerShell examples found in category: ${matchingDir.name}`,
        categoryUrl: matchingDir.html_url
      };
    }

    // Fetch content of first .ps1 file
    const file = ps1Files[0];
    const contentResponse = await fetch(file.download_url);
    const content = await contentResponse.text();
    
    return {
      message: `Found ${ps1Files.length} PowerShell example(s) in category: ${matchingDir.name}`,
      category: matchingDir.name,
      categoryUrl: matchingDir.html_url,
      exampleFiles: ps1Files.map(f => f.name),
      firstExample: {
        name: file.name,
        url: file.html_url,
        contentPreview: content.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      error: 'Failed to fetch PowerShell examples',
      details: error.message
    };
  }
}

// Test 1: List all examples
console.log('Test 1: Listing all available PowerShell example categories...\n');
getPowerShellExamples().then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 2: Search for compute-related examples
  console.log('\n\nTest 2: Searching for "compute" examples...\n');
  return getPowerShellExamples('compute');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 3: Search for boot-related examples
  console.log('\n\nTest 3: Searching for "boot" examples...\n');
  return getPowerShellExamples('boot');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Error:', error);
});
