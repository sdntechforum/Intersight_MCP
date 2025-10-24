#!/usr/bin/env node

// Simple test script to verify MCP server is working
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Set up environment variables
const env = {
  ...process.env,
  INTERSIGHT_API_KEY_ID: "659eb6be75646133013d1368/674e13c2756461310106c391/68f938fd75646131014b1e99",
  INTERSIGHT_API_SECRET_KEY_PATH: "/Users/jicoyne/MCP/auth/jicoyne-v3-SecretKey.txt",
  INTERSIGHT_BASE_URL: "https://intersight.com/api/v1"
};

console.log('Starting MCP server test...\n');

const server = spawn('node', ['build/index.js'], {
  cwd: '/Users/jicoyne/MCP/Intersight_MCP',
  env: env,
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
let inputSent = false;

server.stdout.on('data', (data) => {
  stdout += data.toString();
  console.log('[STDOUT]', data.toString());
});

server.stderr.on('data', (data) => {
  stderr += data.toString();
  console.error('[STDERR]', data.toString());
});

server.on('error', (error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code);
});

// Send a test MCP request to list tools
setTimeout(() => {
  if (!inputSent) {
    inputSent = true;
    const testRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    console.log('\n[TEST] Sending request:', JSON.stringify(testRequest));
    server.stdin.write(JSON.stringify(testRequest) + '\n');
  }
}, 500);

// Give it 10 seconds to respond
setTimeout(() => {
  console.log('\n[TEST] Timeout - killing server');
  server.kill();
  process.exit(1);
}, 10000);
