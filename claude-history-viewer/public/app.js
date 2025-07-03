class ClaudeHistoryViewer {
  constructor() {
    this.conversations = [];
    this.currentConversation = null;
    this.searchResults = null;
    this.showDeveloperInfo = false;
    this.messageMap = new Map(); // For quick message lookup by UUID
    this.sidechainMap = new Map(); // Track sidechain conversations
    
    this.elements = {
      conversationList: document.getElementById('conversationList'),
      conversationView: document.getElementById('conversationView'),
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),
      stats: document.getElementById('stats'),
      developerToggle: document.getElementById('developerToggle')
    };
    
    this.init();
  }
  
  async init() {
    await this.loadConversations();
    await this.loadStats();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
    this.elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    
    // Developer toggle in header
    this.elements.developerToggle?.addEventListener('click', () => {
      this.showDeveloperInfo = !this.showDeveloperInfo;
      this.updateDeveloperView();
    });
  }
  
  updateDeveloperView() {
    const btn = this.elements.developerToggle;
    if (btn) {
      btn.textContent = this.showDeveloperInfo ? '👁️ Hide Developer Info' : '👁️ Show Developer Info';
      btn.classList.toggle('active', this.showDeveloperInfo);
    }
    
    // Toggle visibility of developer elements
    document.querySelectorAll('.thinking-block, .message-metadata, .technical-details').forEach(el => {
      el.style.display = this.showDeveloperInfo ? 'block' : 'none';
    });
    
    // Toggle thread lines in developer mode
    document.querySelector('.messages-container')?.classList.toggle('show-thread-lines', this.showDeveloperInfo);
  }
  
  async loadStats() {
    try {
      const response = await fetch('/api/stats');
      const stats = await response.json();
      
      this.elements.stats.innerHTML = `
        <span class="stat-item">📁 ${stats.totalConversations} conversations</span>
        <span class="stat-item">💬 ${this.formatNumber(stats.totalMessages)} messages</span>
        <span class="stat-item">🪙 ${this.formatTokens(stats.totalTokens)} tokens</span>
        <span class="stat-item">📂 ${stats.projects} projects</span>
      `;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  async loadConversations() {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error(await response.text());
      
      this.conversations = await response.json();
      this.renderConversationList();
    } catch (error) {
      this.elements.conversationList.innerHTML = `
        <div class="error">Failed to load conversations: ${error.message}</div>
      `;
    }
  }
  
  renderConversationList(conversations = this.conversations) {
    if (conversations.length === 0) {
      this.elements.conversationList.innerHTML = '<div class="loading">No conversations found</div>';
      return;
    }
    
    const html = conversations.map(conv => `
      <div class="conversation-item" data-id="${conv.id}">
        <div class="conversation-title">${this.escapeHtml(conv.firstMessage)}</div>
        <div class="conversation-meta">
          <span>📅 ${this.formatDate(conv.lastUpdate)}</span>
          <span>💬 ${conv.messageCount}</span>
          ${conv.matchCount ? `<span>🔍 ${conv.matchCount} matches</span>` : ''}
        </div>
      </div>
    `).join('');
    
    this.elements.conversationList.innerHTML = html;
    
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.loadConversation(id);
        
        document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }
  
  async loadConversation(id) {
    try {
      this.elements.conversationView.innerHTML = '<div class="loading">Loading conversation...</div>';
      
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      
      this.currentConversation = await response.json();
      this.processConversation();
      this.renderConversation();
    } catch (error) {
      this.elements.conversationView.innerHTML = `
        <div class="error">Failed to load conversation: ${error.message}</div>
      `;
    }
  }
  
  processConversation() {
    // Build message map and identify sidechains
    this.messageMap.clear();
    this.sidechainMap.clear();
    
    this.currentConversation.messages.forEach(msg => {
      this.messageMap.set(msg.uuid, msg);
      
      if (msg.isSidechain) {
        const sessionId = msg.sessionId;
        if (!this.sidechainMap.has(sessionId)) {
          this.sidechainMap.set(sessionId, []);
        }
        this.sidechainMap.get(sessionId).push(msg);
      }
    });
    
    // Mark messages that have children
    this.currentConversation.messages.forEach(msg => {
      if (msg.parentUuid && this.messageMap.has(msg.parentUuid)) {
        const parent = this.messageMap.get(msg.parentUuid);
        parent.hasChildren = true;
      }
    });
  }
  
  renderConversation() {
    const conv = this.currentConversation;
    const mainMessages = conv.messages.filter(msg => !msg.isSidechain);
    
    this.elements.conversationView.innerHTML = `
      <div class="conversation-header">
        <h2>${this.escapeHtml(conv.firstMessage)}</h2>
        <div class="conversation-details">
          <span>📂 ${conv.projectPath}</span>
          <span>📅 Created: ${this.formatDate(conv.created)}</span>
          <span>💬 ${conv.messageCount} messages</span>
          <span>🪙 ${this.formatTokens(conv.totalTokens)} tokens</span>
        </div>
      </div>
      <div class="messages-container ${this.showDeveloperInfo ? 'show-thread-lines' : ''}">
        ${this.renderMessageThread(mainMessages)}
      </div>
    `;
    
    // Apply developer view state
    this.updateDeveloperView();
    
    // Setup collapsible elements
    this.setupCollapsibles();
  }
  
  renderMessageThread(messages, level = 0) {
    const grouped = this.groupMessagesByFlow(messages);
    
    return grouped.map(group => {
      if (group.type === 'tool-flow') {
        return this.renderToolFlow(group, level);
      } else if (group.type === 'sidechain') {
        return this.renderSidechain(group, level);
      } else {
        return this.renderMessage(group.message, level);
      }
    }).join('');
  }
  
  groupMessagesByFlow(messages) {
    const groups = [];
    let i = 0;
    
    while (i < messages.length) {
      const msg = messages[i];
      
      // Check if this is a tool use
      if (msg.type === 'assistant' && this.hasToolUse(msg)) {
        // Find corresponding tool result
        const toolUseId = this.getToolUseId(msg);
        let j = i + 1;
        let toolResultMsg = null;
        
        while (j < messages.length && !toolResultMsg) {
          const nextMsg = messages[j];
          if (nextMsg.type === 'user' && this.hasToolResult(nextMsg, toolUseId)) {
            toolResultMsg = nextMsg;
            break;
          }
          j++;
        }
        
        if (toolResultMsg) {
          groups.push({
            type: 'tool-flow',
            toolUse: msg,
            toolResult: toolResultMsg,
            messages: messages.slice(i, j + 1)
          });
          i = j + 1;
          continue;
        }
      }
      
      // Check if this spawns a sidechain
      const sidechainId = this.getSpawnedSidechainId(msg);
      if (sidechainId && this.sidechainMap.has(sidechainId)) {
        groups.push({
          type: 'sidechain',
          spawningMessage: msg,
          sidechainMessages: this.sidechainMap.get(sidechainId),
          sidechainId
        });
        i++;
        continue;
      }
      
      // Regular message
      groups.push({
        type: 'message',
        message: msg
      });
      i++;
    }
    
    return groups;
  }
  
  renderToolFlow(group, level) {
    const { toolUse, toolResult } = group;
    const toolUseContent = this.getToolUseContent(toolUse);
    const toolResultContent = this.getToolResultContent(toolResult);
    const toolResultData = toolResult.toolUseResult; // Get the additional tool result data
    const isError = toolResultContent?.is_error;
    
    return `
      <div class="tool-flow-group" data-level="${level}">
        <div class="tool-flow-connector"></div>
        
        <!-- Tool Use Message -->
        <div class="message assistant tool-use-message" data-uuid="${toolUse.uuid}">
          <div class="message-header">
            <div class="message-info">
              <span class="message-role">🤖 Assistant</span>
              <span class="message-timestamp">${this.formatTimestamp(toolUse.timestamp)}</span>
            </div>
            ${this.renderMessageActions(toolUse)}
          </div>
          
          <!-- Assistant text before tool use -->
          ${this.renderAssistantText(toolUse)}
          
          <!-- Tool Use Card -->
          <div class="tool-use-card ${isError ? 'has-error' : ''}">
            <div class="tool-use-header">
              <span class="tool-icon">${this.getToolIcon(toolUseContent.name)}</span>
              <span class="tool-name">${toolUseContent.name}</span>
              <span class="tool-status">${isError ? '❌ Failed' : '✅ Success'}</span>
            </div>
            
            <div class="tool-use-body collapsible-content">
              <div class="tool-input">
                <div class="section-label">Input:</div>
                <pre class="code-block">${this.escapeHtml(JSON.stringify(toolUseContent.input, null, 2))}</pre>
              </div>
              
              <div class="tool-connector-line"></div>
              
              <div class="tool-output ${isError ? 'error' : 'success'}">
                <div class="section-label">Output:</div>
                <div class="tool-result-content">
                  ${this.formatToolResultContent(toolResultContent, toolResultData)}
                </div>
              </div>
            </div>
            
            <button class="collapse-toggle" aria-label="Toggle tool details">
              <span class="collapse-icon">▼</span>
            </button>
          </div>
          
          ${this.renderThinkingBlock(toolUse)}
          ${this.renderMessageMetadata(toolUse, 'assistant')}
        </div>
      </div>
    `;
  }
  
  renderSidechain(group, level) {
    const { spawningMessage, sidechainMessages, sidechainId } = group;
    
    return `
      <div class="sidechain-group" data-level="${level}">
        <!-- Spawning message -->
        ${this.renderMessage(spawningMessage, level)}
        
        <!-- Sidechain container -->
        <div class="sidechain-container collapsible">
          <div class="sidechain-header">
            <span class="sidechain-icon">🔀</span>
            <span class="sidechain-title">Sub-Agent Task</span>
            <span class="sidechain-meta">${sidechainMessages.length} messages</span>
            <button class="collapse-toggle" aria-label="Toggle sidechain">
              <span class="collapse-icon">▼</span>
            </button>
          </div>
          
          <div class="sidechain-messages collapsible-content">
            ${this.renderMessageThread(sidechainMessages, level + 1)}
          </div>
        </div>
      </div>
    `;
  }
  
  renderMessage(msg, level) {
    if (msg.type === 'user') {
      return this.renderUserMessage(msg, level);
    } else if (msg.type === 'assistant') {
      return this.renderAssistantMessage(msg, level);
    }
    return '';
  }
  
  renderUserMessage(msg, level) {
    let contentHtml = '';
    let isToolResult = false;
    
    if (typeof msg.message?.content === 'string') {
      contentHtml = this.formatMessageContent(msg.message.content);
    } else if (Array.isArray(msg.message?.content)) {
      contentHtml = msg.message.content.map(item => {
        if (item.type === 'text') {
          return this.formatMessageContent(item.text);
        } else if (item.type === 'tool_result') {
          isToolResult = true;
          // Tool results are handled in the tool flow
          return '';
        }
        return '';
      }).join('');
    }
    
    // Skip rendering if this is a pure tool result (handled in tool flow)
    if (isToolResult && !contentHtml.trim()) {
      return '';
    }
    
    return `
      <div class="message user" data-uuid="${msg.uuid}" data-level="${level}">
        <div class="message-header">
          <div class="message-info">
            <span class="message-role">👤 User</span>
            <span class="message-timestamp">${this.formatTimestamp(msg.timestamp)}</span>
          </div>
          ${this.renderMessageActions(msg)}
        </div>
        <div class="message-content">${contentHtml}</div>
        ${this.renderMessageMetadata(msg, 'user')}
      </div>
    `;
  }
  
  renderAssistantMessage(msg, level) {
    if (!msg.message?.content) return '';
    
    // Skip if this is part of a tool flow (handled separately)
    if (this.hasToolUse(msg)) {
      return '';
    }
    
    let contentHtml = '';
    
    if (typeof msg.message.content === 'string') {
      contentHtml = this.formatMessageContent(msg.message.content);
    } else if (Array.isArray(msg.message.content)) {
      contentHtml = msg.message.content.map(item => {
        if (item.type === 'text') {
          return this.formatMessageContent(item.text);
        }
        return '';
      }).join('');
    }
    
    return `
      <div class="message assistant" data-uuid="${msg.uuid}" data-level="${level}">
        <div class="message-header">
          <div class="message-info">
            <span class="message-role">🤖 Assistant</span>
            <span class="message-timestamp">${this.formatTimestamp(msg.timestamp)}</span>
          </div>
          ${this.renderMessageActions(msg)}
        </div>
        <div class="message-content">${contentHtml}</div>
        ${this.renderThinkingBlock(msg)}
        ${this.renderMessageMetadata(msg, 'assistant')}
      </div>
    `;
  }
  
  renderAssistantText(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return '';
    
    const textContent = msg.message.content
      .filter(item => item.type === 'text')
      .map(item => this.formatMessageContent(item.text))
      .join('');
    
    if (!textContent.trim()) return '';
    
    return `<div class="message-content">${textContent}</div>`;
  }
  
  renderThinkingBlock(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return '';
    
    const thinkingContent = msg.message.content.find(item => item.type === 'thinking');
    if (!thinkingContent) return '';
    
    return `
      <div class="thinking-block" style="display: ${this.showDeveloperInfo ? 'block' : 'none'}">
        <div class="thinking-header">
          <span class="thinking-icon">🧠</span>
          <span>Internal Reasoning</span>
        </div>
        <div class="thinking-content">
          ${this.formatMessageContent(thinkingContent.thinking)}
        </div>
      </div>
    `;
  }
  
  renderMessageActions(msg) {
    const actions = [];
    
    if (msg.parentUuid) {
      actions.push(`<button class="action-btn" onclick="window.viewer.scrollToMessage('${msg.parentUuid}')" title="Jump to parent">⬆️</button>`);
    }
    
    if (msg.hasChildren) {
      actions.push(`<button class="action-btn" title="Has replies">⬇️</button>`);
    }
    
    return actions.length > 0 ? `<div class="message-actions">${actions.join('')}</div>` : '';
  }
  
  renderMessageMetadata(msg, role) {
    let metadataItems = [];
    
    // Common metadata
    metadataItems.push(`
      <div class="metadata-item">
        <div class="metadata-label">UUID</div>
        <div class="metadata-value">${msg.uuid}</div>
      </div>
    `);
    
    if (msg.parentUuid) {
      metadataItems.push(`
        <div class="metadata-item">
          <div class="metadata-label">Parent UUID</div>
          <div class="metadata-value">${msg.parentUuid}</div>
        </div>
      `);
    }
    
    if (msg.isSidechain !== undefined) {
      metadataItems.push(`
        <div class="metadata-item">
          <div class="metadata-label">Is Sidechain</div>
          <div class="metadata-value">${msg.isSidechain}</div>
        </div>
      `);
    }
    
    metadataItems.push(`
      <div class="metadata-item">
        <div class="metadata-label">Working Directory</div>
        <div class="metadata-value">${msg.cwd}</div>
      </div>
    `);
    
    metadataItems.push(`
      <div class="metadata-item">
        <div class="metadata-label">Version</div>
        <div class="metadata-value">${msg.version}</div>
      </div>
    `);
    
    // Assistant-specific metadata
    if (role === 'assistant' && msg.message) {
      if (msg.message.model) {
        metadataItems.push(`
          <div class="metadata-item">
            <div class="metadata-label">Model</div>
            <div class="metadata-value">${msg.message.model}</div>
          </div>
        `);
      }
      
      if (msg.requestId) {
        metadataItems.push(`
          <div class="metadata-item">
            <div class="metadata-label">Request ID</div>
            <div class="metadata-value">${msg.requestId}</div>
          </div>
        `);
      }
      
      if (msg.message.usage) {
        const usage = msg.message.usage;
        metadataItems.push(`
          <div class="metadata-item">
            <div class="metadata-label">Token Usage</div>
            <div class="metadata-value">
              <div class="token-usage">
                <span class="token-item">📥 Input: ${usage.input_tokens || 0}</span>
                <span class="token-item">📤 Output: ${usage.output_tokens || 0}</span>
                ${usage.cache_creation_input_tokens ? `<span class="token-item">💾 Cache Create: ${usage.cache_creation_input_tokens}</span>` : ''}
                ${usage.cache_read_input_tokens ? `<span class="token-item">📖 Cache Read: ${usage.cache_read_input_tokens}</span>` : ''}
              </div>
            </div>
          </div>
        `);
      }
    }
    
    return `<div class="message-metadata" style="display: ${this.showDeveloperInfo ? 'grid' : 'none'}">${metadataItems.join('')}</div>`;
  }
  
  setupCollapsibles() {
    // Setup collapse toggles
    document.querySelectorAll('.collapse-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = btn.closest('.collapsible, .tool-use-card, .sidechain-container');
        const content = container.querySelector('.collapsible-content');
        const icon = btn.querySelector('.collapse-icon');
        
        container.classList.toggle('collapsed');
        icon.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
      });
    });
    
    // Setup show more buttons for long content
    document.querySelectorAll('.show-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = btn.closest('.long-content');
        const collapsibleContent = container.querySelector('.collapsible-content');
        
        if (collapsibleContent.style.display === 'none' || !collapsibleContent.style.display) {
          collapsibleContent.style.display = 'block';
          btn.textContent = 'Show less...';
        } else {
          collapsibleContent.style.display = 'none';
          btn.textContent = 'Show more...';
        }
      });
    });
  }
  
  // Helper methods
  hasToolUse(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return false;
    return msg.message.content.some(item => item.type === 'tool_use');
  }
  
  hasToolResult(msg, toolUseId) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return false;
    return msg.message.content.some(item => 
      item.type === 'tool_result' && item.tool_use_id === toolUseId
    );
  }
  
  getToolUseId(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return null;
    const toolUse = msg.message.content.find(item => item.type === 'tool_use');
    return toolUse?.id;
  }
  
  getToolUseContent(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return null;
    return msg.message.content.find(item => item.type === 'tool_use');
  }
  
  getToolResultContent(msg) {
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return null;
    return msg.message.content.find(item => item.type === 'tool_result');
  }
  
  getSpawnedSidechainId(msg) {
    // Check if this message has a Task tool use that spawns a sidechain
    if (!msg.message?.content || !Array.isArray(msg.message.content)) return null;
    
    const taskToolUse = msg.message.content.find(item => 
      item.type === 'tool_use' && item.name === 'Task'
    );
    
    if (!taskToolUse) return null;
    
    // Look for the corresponding tool result in the next messages
    // that might contain the sidechain ID
    // This is a simplified approach - in reality, we'd need to trace
    // through the messages to find the spawned sidechain
    
    // For now, return null as we'd need more complex logic to properly
    // link Task tool uses to their spawned sidechains
    return null;
  }
  
  getToolIcon(toolName) {
    const icons = {
      'Bash': '⚡',
      'WebFetch': '🌐',
      'WebSearch': '🔍',
      'Read': '📖',
      'Write': '✏️',
      'Edit': '📝',
      'MultiEdit': '📝',
      'TodoWrite': '✅',
      'TodoRead': '📋',
      'Task': '🎯',
      'Agent': '🤖',
      'Glob': '🔍',
      'Grep': '🔎',
      'LS': '📁',
      'NotebookRead': '📓',
      'NotebookEdit': '📓',
      'exit_plan_mode': '🎯'
    };
    return icons[toolName] || '🔧';
  }
  
  formatToolResultContent(toolResult, toolResultData) {
    if (!toolResult) return 'No result';
    
    let html = '';
    
    // First, show the main content
    const content = toolResult.content || '';
    
    // Check if content is JSON
    try {
      const parsed = JSON.parse(content);
      html += `<pre class="code-block">${this.escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
    } catch {
      // Not JSON, format as text
      if (content.length > 1000) {
        html += `
          <div class="long-content">
            <pre class="code-block">${this.escapeHtml(content.substring(0, 500))}</pre>
            <div class="collapsible-content" style="display: none;">
              <pre class="code-block">${this.escapeHtml(content.substring(500))}</pre>
            </div>
            <button class="show-more-btn">Show more...</button>
          </div>
        `;
      } else {
        html += `<pre class="code-block">${this.escapeHtml(content)}</pre>`;
      }
    }
    
    // If there's additional toolResultData, display it
    if (toolResultData && typeof toolResultData === 'object') {
      html += this.formatToolResultData(toolResultData);
    }
    
    return html;
  }
  
  formatToolResultData(data) {
    // Handle different types of tool result data
    let html = '<div class="tool-result-metadata">';
    
    // Check for Task tool specific fields
    if (data.summary || data.sidechainId) {
      html += '<div class="task-result-summary">';
      
      if (data.summary) {
        html += `<div class="summary-item"><strong>Summary:</strong> ${this.escapeHtml(data.summary)}</div>`;
      }
      
      if (data.sidechainId) {
        html += `<div class="summary-item"><strong>Sub-agent Session:</strong> ${data.sidechainId}</div>`;
      }
      
      if (data.messagesInSidechain) {
        html += `<div class="summary-item"><strong>Messages in sub-task:</strong> ${data.messagesInSidechain}</div>`;
      }
      
      if (data.tokensUsed) {
        html += `<div class="summary-item"><strong>Tokens used:</strong> ${this.formatTokens(data.tokensUsed)}</div>`;
      }
      
      if (data.details && typeof data.details === 'object') {
        html += '<div class="task-details">';
        html += '<strong>Details:</strong>';
        html += `<pre class="code-block">${this.escapeHtml(JSON.stringify(data.details, null, 2))}</pre>`;
        html += '</div>';
      }
      
      html += '</div>';
    }
    // Handle Bash tool results
    else if ('stdout' in data || 'stderr' in data) {
      if (data.stdout) {
        html += '<div class="bash-output">';
        html += '<div class="output-label">Standard Output:</div>';
        html += `<pre class="code-block">${this.escapeHtml(data.stdout)}</pre>`;
        html += '</div>';
      }
      
      if (data.stderr) {
        html += '<div class="bash-error">';
        html += '<div class="output-label">Standard Error:</div>';
        html += `<pre class="code-block error">${this.escapeHtml(data.stderr)}</pre>`;
        html += '</div>';
      }
      
      if (data.interrupted) {
        html += '<div class="bash-interrupted">⚠️ Process was interrupted</div>';
      }
    }
    // Handle TodoWrite tool results
    else if (data.oldTodos || data.newTodos) {
      html += '<div class="todo-changes">';
      
      if (data.oldTodos && data.oldTodos.length > 0) {
        html += '<div class="todos-section">';
        html += '<strong>Previous Todos:</strong>';
        html += '<ul class="todo-list old">';
        data.oldTodos.forEach(todo => {
          html += `<li class="todo-item ${todo.status}">${this.escapeHtml(todo.content)} (${todo.priority})</li>`;
        });
        html += '</ul>';
        html += '</div>';
      }
      
      if (data.newTodos && data.newTodos.length > 0) {
        html += '<div class="todos-section">';
        html += '<strong>Updated Todos:</strong>';
        html += '<ul class="todo-list new">';
        data.newTodos.forEach(todo => {
          html += `<li class="todo-item ${todo.status}">${this.escapeHtml(todo.content)} (${todo.priority})</li>`;
        });
        html += '</ul>';
        html += '</div>';
      }
      
      html += '</div>';
    }
    // Generic object display
    else {
      html += '<div class="generic-result-data">';
      html += '<strong>Additional Data:</strong>';
      html += `<pre class="code-block">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  scrollToMessage(uuid) {
    const element = document.querySelector(`[data-uuid="${uuid}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-flash');
      setTimeout(() => element.classList.remove('highlight-flash'), 2000);
    }
  }
  
  async handleSearch() {
    const query = this.elements.searchInput.value.trim();
    if (!query) {
      this.renderConversationList(this.conversations);
      return;
    }
    
    try {
      this.elements.conversationList.innerHTML = '<div class="loading">Searching...</div>';
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      
      if (results.length === 0) {
        this.elements.conversationList.innerHTML = '<div class="loading">No results found</div>';
        return;
      }
      
      this.elements.conversationList.innerHTML = `
        <div class="search-result-header">Found ${results.length} conversations with matches</div>
      `;
      
      this.renderConversationList(results);
    } catch (error) {
      this.elements.conversationList.innerHTML = `
        <div class="error">Search failed: ${error.message}</div>
      `;
    }
  }
  
  formatMessageContent(content) {
    let formatted = this.escapeHtml(content);
    
    // Format code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format links
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
    });
    
    // Format bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Format italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return formatted;
  }
  
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) { // Less than 1 hour
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diff < 604800000) { // Less than 1 week
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  }
  
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
  
  formatNumber(num) {
    return num.toLocaleString();
  }
  
  formatTokens(tokens) {
    if (tokens > 1000000) {
      return (tokens / 1000000).toFixed(1) + 'M';
    } else if (tokens > 1000) {
      return (tokens / 1000).toFixed(1) + 'k';
    }
    return tokens.toLocaleString();
  }
}

// Make viewer globally accessible for onclick handlers
window.viewer = null;

document.addEventListener('DOMContentLoaded', () => {
  window.viewer = new ClaudeHistoryViewer();
});