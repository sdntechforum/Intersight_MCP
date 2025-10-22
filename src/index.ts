#!/usr/bin/env node

import { IntersightMCPServer } from './server.js';

async function main() {
  const server = new IntersightMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
