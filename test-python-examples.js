// Test script for Python examples functionality

async function getPythonExamples(topic, source = 'all') {
  const examplesUrl = 'https://api.github.com/repos/CiscoUcs/intersight-python/contents/examples';
  const utilsUrl = 'https://api.github.com/repos/CiscoDevNet/intersight-python-utils/contents';
  
  try {
    const results = {
      sources: [],
      examples: [],
      totalCount: 0
    };

    // Fetch from SDK examples repository
    if (source === 'examples' || source === 'all') {
      try {
        const response = await fetch(examplesUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Intersight-MCP-Server'
          }
        });

        if (response.ok) {
          const items = await response.json();
          const pyFiles = items.filter((item) => item.type === 'file' && item.name.endsWith('.py'));
          
          results.sources.push({
            name: 'SDK Examples',
            repository: 'CiscoUcs/intersight-python',
            url: 'https://github.com/CiscoUcs/intersight-python/tree/master/examples',
            count: pyFiles.length
          });

          if (!topic) {
            results.examples.push(...pyFiles.slice(0, 10).map((file) => ({
              source: 'SDK Examples',
              name: file.name,
              url: file.html_url
            })));
          } else {
            const matching = pyFiles.filter((file) => 
              file.name.toLowerCase().includes(topic.toLowerCase())
            );
            
            for (const file of matching.slice(0, 2)) {
              const contentResponse = await fetch(file.download_url);
              const content = await contentResponse.text();
              results.examples.push({
                source: 'SDK Examples',
                name: file.name,
                url: file.html_url,
                contentPreview: content.substring(0, 300) + '...'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching SDK examples:', error);
      }
    }

    // Fetch from Python utilities repository
    if (source === 'utils' || source === 'all') {
      try {
        const response = await fetch(utilsUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Intersight-MCP-Server'
          }
        });

        if (response.ok) {
          const items = await response.json();
          const pyFiles = items.filter((item) => item.type === 'file' && item.name.endsWith('.py'));
          
          results.sources.push({
            name: 'Python Utilities',
            repository: 'CiscoDevNet/intersight-python-utils',
            url: 'https://github.com/CiscoDevNet/intersight-python-utils',
            count: pyFiles.length
          });

          if (!topic) {
            results.examples.push(...pyFiles.slice(0, 10).map((file) => ({
              source: 'Python Utilities',
              name: file.name,
              url: file.html_url
            })));
          } else {
            const matching = pyFiles.filter((file) => 
              file.name.toLowerCase().includes(topic.toLowerCase())
            );
            
            for (const file of matching.slice(0, 2)) {
              const contentResponse = await fetch(file.download_url);
              const content = await contentResponse.text();
              results.examples.push({
                source: 'Python Utilities',
                name: file.name,
                url: file.html_url,
                contentPreview: content.substring(0, 300) + '...'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Python utilities:', error);
      }
    }

    results.totalCount = results.examples.length;

    if (!topic) {
      return {
        message: 'Available Python examples and utilities for Cisco Intersight',
        sources: results.sources,
        totalExamples: results.totalCount,
        examplesSample: results.examples
      };
    }

    return {
      message: `Found Python example(s) for topic: ${topic}`,
      sources: results.sources,
      examples: results.examples
    };
  } catch (error) {
    return {
      error: 'Failed to fetch Python examples',
      details: error.message
    };
  }
}

// Test 1: List all examples from both sources
console.log('Test 1: Listing available Python examples from both repositories...\n');
getPythonExamples().then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 2: Search for server-related examples
  console.log('\n\nTest 2: Searching for "server" examples...\n');
  return getPythonExamples('server');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
  
  // Test 3: Search only in utils
  console.log('\n\nTest 3: Searching for "claim" in utils only...\n');
  return getPythonExamples('claim', 'utils');
}).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Error:', error);
});
