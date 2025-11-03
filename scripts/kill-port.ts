import { killPort } from '@/utils/kill-port';

const [, , portArg] = process.argv;
const defaultPort = 4000;
const port = Number(portArg ?? process.env['PORT'] ?? defaultPort);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`🔴 Invalid port value "${portArg}". Provide a numeric port, e.g. pnpm kill-port 4000`);
  process.exit(1);
}

try {
  killPort(port);
  console.log(`✅ Cleared port ${port}`);
} catch (error) {
  console.error('🔴 Failed to kill process(es):', error instanceof Error ? error.message : error);
  process.exit(1);
}
