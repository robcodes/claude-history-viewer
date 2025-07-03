import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import chalk from 'chalk';
import { HistoryParser } from './historyParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer(options) {
  const { port, host, claudeDir, openBrowser, isDev } = options;
  
  const app = express();
  const parser = new HistoryParser(claudeDir);
  
  app.use(cors());
  app.use(express.json());
  
  app.use(express.static(path.join(__dirname, '../public')));
  
  app.get('/api/conversations', async (req, res) => {
    try {
      const conversations = await parser.findConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const conversation = await parser.getConversation(req.params.id);
      res.json(conversation);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
      }
      
      const results = await parser.searchConversations(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/stats', async (req, res) => {
    try {
      const conversations = await parser.findConversations();
      
      const stats = {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
        totalTokens: conversations.reduce((sum, c) => sum + c.totalTokens, 0),
        projects: [...new Set(conversations.map(c => c.projectPath))].length,
        dateRange: {
          earliest: conversations.length > 0 ? conversations[conversations.length - 1].created : null,
          latest: conversations.length > 0 ? conversations[0].lastUpdate : null
        }
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  const server = app.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(chalk.green(`✓ Server running at ${chalk.bold(url)}`));
    console.log(chalk.gray(`  Claude directory: ${parser.claudeDir}`));
    console.log(chalk.gray(`  Press Ctrl+C to stop\n`));
    
    if (openBrowser && !isDev) {
      open(url);
    }
  });
  
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down server...'));
    server.close(() => {
      console.log(chalk.green('Server stopped'));
      process.exit(0);
    });
  });
  
  return server;
}