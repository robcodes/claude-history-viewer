import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { glob } from 'glob';

export class HistoryParser {
  constructor(claudeDir) {
    this.claudeDir = claudeDir || process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  }

  async findConversations() {
    const projectsDir = path.join(this.claudeDir, 'projects');
    
    try {
      await fs.access(projectsDir);
    } catch (error) {
      throw new Error(`Claude history directory not found at ${projectsDir}. Make sure Claude Code is installed and has been used.`);
    }

    const pattern = path.join(projectsDir, '**/*.jsonl');
    const files = await glob(pattern);
    
    const conversations = [];
    
    for (const file of files) {
      const metadata = await this.parseConversationMetadata(file);
      if (metadata) {
        conversations.push(metadata);
      }
    }
    
    conversations.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    
    return conversations;
  }

  async parseConversationMetadata(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      if (lines.length === 0) return null;
      
      const firstMessage = JSON.parse(lines[0]);
      const lastMessage = lines.length > 1 ? JSON.parse(lines[lines.length - 1]) : firstMessage;
      
      const userMessages = [];
      let totalTokens = 0;
      
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          
          if (msg.type === 'user' && msg.message?.content) {
            const content = typeof msg.message.content === 'string' 
              ? msg.message.content 
              : msg.message.content[0]?.text || '';
            userMessages.push(content);
          }
          
          if (msg.message?.usage) {
            totalTokens += (msg.message.usage.input_tokens || 0) + (msg.message.usage.output_tokens || 0);
          }
        } catch (e) {
          continue;
        }
      }
      
      const projectsDir = path.join(this.claudeDir, 'projects');
      const projectPath = path.dirname(filePath).replace(projectsDir, '').replace(/^\//, '');
      
      return {
        id: path.basename(filePath, '.jsonl'),
        filePath,
        projectPath: projectPath.replace(/-/g, '/'),
        firstMessage: userMessages[0] || 'Empty conversation',
        messageCount: lines.length,
        userMessageCount: userMessages.length,
        totalTokens,
        created: firstMessage.timestamp,
        lastUpdate: lastMessage.timestamp || firstMessage.timestamp,
        sessionId: firstMessage.sessionId
      };
    } catch (error) {
      // Error parsing file - return null to skip this conversation
      return null;
    }
  }

  async getConversation(conversationId) {
    const conversations = await this.findConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const content = await fs.readFile(conversation.filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    
    const messages = [];
    
    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        messages.push(msg);
      } catch (e) {
        // Skip malformed message lines
      }
    }
    
    return {
      ...conversation,
      messages
    };
  }

  async searchConversations(query) {
    const conversations = await this.findConversations();
    const results = [];
    
    const searchTerm = query.toLowerCase();
    
    for (const conv of conversations) {
      const content = await fs.readFile(conv.filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      const matches = [];
      
      for (let i = 0; i < lines.length; i++) {
        try {
          const msg = JSON.parse(lines[i]);
          
          let textContent = '';
          if (msg.message?.content) {
            if (typeof msg.message.content === 'string') {
              textContent = msg.message.content;
            } else if (Array.isArray(msg.message.content)) {
              textContent = msg.message.content
                .filter(c => c.type === 'text')
                .map(c => c.text)
                .join(' ');
            }
          }
          
          if (textContent.toLowerCase().includes(searchTerm)) {
            matches.push({
              lineNumber: i,
              content: textContent,
              type: msg.type,
              timestamp: msg.timestamp
            });
          }
        } catch (e) {
          continue;
        }
      }
      
      if (matches.length > 0) {
        results.push({
          ...conv,
          matches,
          matchCount: matches.length
        });
      }
    }
    
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    return results;
  }
}