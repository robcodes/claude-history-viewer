#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from '../src/server.js';
import { findAvailablePort } from '../src/utils.js';

const program = new Command();

program
  .name('claude-history-viewer')
  .description('View your Claude Code conversation history in a web interface')
  .version('1.0.0')
  .option('-p, --port <number>', 'port to run the server on', '0')
  .option('-d, --dir <path>', 'Claude config directory (defaults to CLAUDE_CONFIG_DIR or ~/.claude)')
  .option('--no-open', 'do not open browser automatically')
  .option('--host <host>', 'host to bind to', 'localhost')
  .option('--dev', 'run in development mode', false)
  .action(async (options) => {
    try {
      const port = await findAvailablePort(parseInt(options.port) || 0);
      
      console.log(chalk.blue('🚀 Starting Claude History Viewer...'));
      
      await startServer({
        port,
        host: options.host,
        claudeDir: options.dir,
        openBrowser: options.open,
        isDev: options.dev
      });
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();