class ClaudeHistoryViewer {
  constructor() {
    this.conversations = [];
    this.currentConversation = null;
    this.searchResults = null;
    this.showDeveloperInfo = false;
    this.messageMap = new Map(); // For quick message lookup by UUID
    this.sidechainMap = new Map(); // Track sidechain conversations
    this.sidebarCollapsed = false;
    
    this.elements = {
      conversationList: document.getElementById('conversationList'),
      conversationView: document.getElementById('conversationView'),
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),
      stats: document.getElementById('stats'),
      developerToggle: document.getElementById('developerToggle'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebarToggle'),
      sidebarClose: document.getElementById('sidebarClose'),
      sidebarOverlay: document.getElementById('sidebarOverlay'),
      mainContent: document.getElementById('mainContent')
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
    
    // Sidebar toggle functionality
    this.elements.sidebarToggle?.addEventListener('click', () => {
      this.toggleSidebar();
    });
    
    this.elements.sidebarClose?.addEventListener('click', () => {
      this.toggleSidebar();
    });
    
    // Close sidebar when clicking overlay on mobile
    this.elements.sidebarOverlay?.addEventListener('click', () => {
      if (!this.sidebarCollapsed) {
        this.toggleSidebar();
      }
    });
    
    // Initialize sidebar state
    this.updateSidebarState();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateSidebarState();
      }, 250);
    });
    
    // Event delegation for dynamic show more/less buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('show-more-btn')) {
        const container = e.target.closest('.expandable-content');
        if (container) {
          const preview = container.querySelector('.content-preview');
          const full = container.querySelector('.content-full');
          const isExpanded = full.style.display !== 'none';
          
          if (isExpanded) {
            preview.style.display = 'block';
            full.style.display = 'none';
            e.target.textContent = 'Show more...';
          } else {
            preview.style.display = 'none';
            full.style.display = 'block';
            e.target.textContent = 'Show less';
          }
        }
      }
    });
  }
  
  updateDeveloperView() {
    const btn = this.elements.developerToggle;
    if (btn) {
      btn.textContent = this.showDeveloperInfo ? '👁️ Hide Developer Info' : '👁️ Show Developer Info';
      btn.classList.toggle('active', this.showDeveloperInfo);
    }
    
    // Toggle visibility of developer elements (excluding thinking blocks)
    document.querySelectorAll('.message-metadata, .technical-details').forEach(el => {
      el.style.display = this.showDeveloperInfo ? 'block' : 'none';
    });
    
    // Toggle thread lines in developer mode
    document.querySelector('.messages-container')?.classList.toggle('show-thread-lines', this.showDeveloperInfo);
  }
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.updateSidebarState();
  }
  
  updateSidebarState() {
    const isMobile = window.innerWidth <= 768;
    
    if (this.sidebarCollapsed) {
      this.elements.sidebar?.classList.add('collapsed');
      this.elements.mainContent?.classList.add('sidebar-collapsed');
      this.elements.sidebarToggle?.classList.add('visible');
      this.elements.sidebarOverlay?.classList.remove('visible');
    } else {
      this.elements.sidebar?.classList.remove('collapsed');
      this.elements.mainContent?.classList.remove('sidebar-collapsed');
      this.elements.sidebarToggle?.classList.remove('visible');
      
      if (isMobile) {
        this.elements.sidebarOverlay?.classList.add('visible');
      }
    }
    
    // On desktop, show toggle button when sidebar is collapsed
    if (!isMobile) {
      this.elements.sidebarToggle?.classList.toggle('visible', this.sidebarCollapsed);
    }
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
      // Failed to load stats - continue silently
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
        
        // Auto-collapse sidebar on mobile after selecting a conversation
        if (window.innerWidth <= 768 && !this.sidebarCollapsed) {
          this.toggleSidebar();
        }
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
    
    // First pass: build message map and group sidechains by sessionId
    const sidechainGroups = new Map();
    
    this.currentConversation.messages.forEach(msg => {
      this.messageMap.set(msg.uuid, msg);
      
      if (msg.isSidechain) {
        const sessionId = msg.sessionId;
        if (!sidechainGroups.has(sessionId)) {
          sidechainGroups.set(sessionId, {
            messages: [],
            firstMessageTime: msg.timestamp,
            taskToolUuid: null
          });
        }
        sidechainGroups.get(sessionId).messages.push(msg);
      }
    });
    
    // Sort sidechain messages by timestamp within each group
    for (const [sessionId, group] of sidechainGroups) {
      group.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    // Second pass: link Task tools to sidechains
    // We'll track all Task tools and their results first
    const taskTools = [];
    
    this.currentConversation.messages.forEach((msg, index) => {
      if (msg.type === 'assistant' && this.hasToolUse(msg)) {
        const toolUse = this.getToolUseContent(msg);
        if (toolUse && toolUse.name === 'Task') {
          // Find the corresponding tool result
          const toolUseId = this.getToolUseId(msg);
          let toolResultMsg = null;
          let toolResultIndex = -1;
          
          // Look for the tool result in subsequent messages
          for (let i = index + 1; i < this.currentConversation.messages.length; i++) {
            const nextMsg = this.currentConversation.messages[i];
            if (nextMsg.type === 'user' && this.hasToolResult(nextMsg, toolUseId)) {
              toolResultMsg = nextMsg;
              toolResultIndex = i;
              break;
            }
          }
          
          if (toolResultMsg) {
            taskTools.push({
              toolUseMsg: msg,
              toolResultMsg: toolResultMsg,
              toolUseIndex: index,
              toolResultIndex: toolResultIndex,
              timestamp: new Date(toolResultMsg.timestamp).getTime()
            });
          }
        }
      }
      
      // Mark messages that have children
      if (msg.parentUuid && this.messageMap.has(msg.parentUuid)) {
        const parent = this.messageMap.get(msg.parentUuid);
        parent.hasChildren = true;
      }
    });
    
    // Sort task tools by timestamp
    taskTools.sort((a, b) => a.timestamp - b.timestamp);
    
    // Now link sidechains to Task tools using improved logic
    for (const [sessionId, group] of sidechainGroups) {
      const sidechainStartTime = new Date(group.firstMessageTime).getTime();
      let bestMatch = null;
      let bestScore = -Infinity;
      
      // Find the best matching Task tool for this sidechain
      for (let i = 0; i < taskTools.length; i++) {
        const task = taskTools[i];
        
        // Score based on multiple factors
        let score = 0;
        
        // 1. Temporal proximity - sidechain should start after Task tool result
        const timeDiff = sidechainStartTime - task.timestamp;
        if (timeDiff > 0 && timeDiff < 60000) { // Within 1 minute
          // Higher score for closer temporal proximity
          score += (60000 - timeDiff) / 1000; // Max 60 points
        } else if (timeDiff < 0) {
          // Sidechain started before task result - not a match
          continue;
        }
        
        // 2. Check if this is the next sidechain after the Task tool
        // (no other sidechains between this Task and this sidechain)
        let hasIntermediateSidechain = false;
        for (const [otherId, otherGroup] of sidechainGroups) {
          if (otherId !== sessionId) {
            const otherStartTime = new Date(otherGroup.firstMessageTime).getTime();
            if (otherStartTime > task.timestamp && otherStartTime < sidechainStartTime) {
              hasIntermediateSidechain = true;
              break;
            }
          }
        }
        if (!hasIntermediateSidechain) {
          score += 30; // Bonus for being the next sidechain
        }
        
        // 3. Check if there's another Task tool between this Task and the sidechain
        let hasIntermediateTask = false;
        for (let j = i + 1; j < taskTools.length; j++) {
          if (taskTools[j].timestamp < sidechainStartTime) {
            hasIntermediateTask = true;
            break;
          }
        }
        if (!hasIntermediateTask) {
          score += 20; // Bonus for no intermediate Task tools
        }
        
        // 4. Check tool result content for explicit sidechainId
        const toolResultData = task.toolResultMsg.toolUseResult;
        if (toolResultData && typeof toolResultData === 'object') {
          // Check direct sidechainId
          if (toolResultData.sidechainId === sessionId) {
            score += 1000; // Huge bonus for explicit match
          }
          
          // Check in content array
          if (Array.isArray(toolResultData.content)) {
            toolResultData.content.forEach(item => {
              if (item && typeof item === 'object' && item.sidechainId === sessionId) {
                score += 1000; // Huge bonus for explicit match
              }
            });
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = task;
        }
      }
      
      // Link the sidechain to the best matching Task tool
      if (bestMatch && bestScore > 0) {
        group.taskToolUuid = bestMatch.toolUseMsg.uuid;
        this.sidechainMap.set(bestMatch.toolUseMsg.uuid, group.messages);
      }
    }
    
    // Store orphaned sidechains (not linked to any Task tool)
    this.orphanedSidechains = [];
    for (const [sessionId, group] of sidechainGroups) {
      if (!group.taskToolUuid) {
        this.orphanedSidechains.push({
          sessionId,
          messages: group.messages
        });
      }
    }
  }
  
  renderConversation() {
    const conv = this.currentConversation;
    const mainMessages = conv.messages.filter(msg => !msg.isSidechain);
    
    // Debug information about sidechains
    const sidechainCount = conv.messages.filter(msg => msg.isSidechain).length;
    const linkedSidechainCount = this.sidechainMap.size;
    const orphanedSidechainCount = this.orphanedSidechains?.length || 0;
    
    console.log(`🔍 Sidechain Debug:
      Total sidechains: ${sidechainCount}
      Linked sidechains: ${linkedSidechainCount}
      Orphaned sidechains: ${orphanedSidechainCount}
      Sidechain map:`, this.sidechainMap);
    
    this.elements.conversationView.innerHTML = `
      <div class="conversation-header">
        <h2>${this.escapeHtml(conv.firstMessage)}</h2>
        <div class="conversation-details">
          <span>📂 ${conv.projectPath}</span>
          <span>📅 Created: ${this.formatDate(conv.created)}</span>
          <span>💬 ${conv.messageCount} messages</span>
          <span>🪙 ${this.formatTokens(conv.totalTokens)} tokens</span>
          ${sidechainCount > 0 ? `<span>🔀 ${sidechainCount} sidechain messages (${linkedSidechainCount} linked)</span>` : ''}
        </div>
        <div class="file-path-container">
          <span class="file-path-label">📄 File:</span>
          <code class="file-path">${this.escapeHtml(conv.filePath)}</code>
          <button class="copy-path-btn" onclick="viewer.copyToClipboard('${this.escapeHtml(conv.filePath).replace(/'/g, "\\'")}')">📋 Copy</button>
          <span class="copy-feedback" style="display: none;">✅ Copied!</span>
        </div>
      </div>
      <div class="messages-container ${this.showDeveloperInfo ? 'show-thread-lines' : ''}">
        ${this.renderMessageThread(mainMessages)}
        ${this.renderOrphanedSidechains()}
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
          // Check if this tool use has an associated sidechain
          const sidechainMessages = this.sidechainMap.get(msg.uuid);
          
          groups.push({
            type: 'tool-flow',
            toolUse: msg,
            toolResult: toolResultMsg,
            messages: messages.slice(i, j + 1),
            sidechainMessages: sidechainMessages || null
          });
          i = j + 1;
          continue;
        }
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
    const { toolUse, toolResult, sidechainMessages } = group;
    const toolUseContent = this.getToolUseContent(toolUse);
    const toolResultContent = this.getToolResultContent(toolResult);
    const toolResultData = toolResult.toolUseResult; // Get the additional tool result data
    
    // If toolResultData is an object and contains the actual content, use it
    if (typeof toolResultData === 'object' && toolResultData !== null && toolResultData.content) {
      // Override the content if it's "[object Object]"
      if (toolResultContent && toolResultContent.content === '[object Object]') {
        toolResultContent.content = toolResultData;
      }
    }
    
    const isError = toolResultContent?.is_error;
    const isTaskTool = toolUseContent.name === 'Task';
    
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
          <div class="tool-use-card ${isError ? 'has-error' : ''} ${isTaskTool && sidechainMessages ? 'has-sidechain' : ''}">
            <div class="tool-use-header">
              <span class="tool-icon">${this.getToolIcon(toolUseContent.name)}</span>
              <span class="tool-name">${toolUseContent.name}</span>
              <span class="tool-status">${isError ? '❌ Failed' : '✅ Success'}</span>
              ${isTaskTool && sidechainMessages ? '<span class="sidechain-indicator">🔀 Has sub-agent task</span>' : ''}
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
        
        ${sidechainMessages ? this.renderSidechainSection(sidechainMessages, level + 1) : ''}
      </div>
    `;
  }
  
  renderSidechainSection(sidechainMessages, level) {
    if (!sidechainMessages || sidechainMessages.length === 0) return '';
    
    // Extract summary information from sidechain messages
    const firstMessage = sidechainMessages[0];
    const lastMessage = sidechainMessages[sidechainMessages.length - 1];
    const sessionId = firstMessage.sessionId;
    
    // Calculate token usage for the sidechain
    let sidechainTokens = 0;
    sidechainMessages.forEach(msg => {
      if (msg.message?.usage) {
        sidechainTokens += (msg.message.usage.input_tokens || 0) + (msg.message.usage.output_tokens || 0);
      }
    });
    
    return `
      <div class="sidechain-container collapsible collapsed" data-session-id="${sessionId}">
        <div class="sidechain-header">
          <span class="sidechain-icon">🔀</span>
          <span class="sidechain-title">Sub-Agent Task</span>
          <span class="sidechain-meta">
            <span class="sidechain-stat">${sidechainMessages.length} messages</span>
            <span class="sidechain-stat">🪙 ${this.formatTokens(sidechainTokens)}</span>
          </span>
          <button class="collapse-toggle" aria-label="Toggle sidechain">
            <span class="collapse-icon">▶</span>
          </button>
        </div>
        
        <div class="sidechain-messages collapsible-content">
          <div class="sidechain-info">
            <div class="sidechain-detail">
              <span class="detail-label">Session ID:</span>
              <span class="detail-value">${sessionId}</span>
            </div>
            <div class="sidechain-detail">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${this.formatDuration(firstMessage.timestamp, lastMessage.timestamp)}</span>
            </div>
          </div>
          ${this.renderMessageThread(sidechainMessages, level + 1)}
        </div>
      </div>
    `;
  }
  
  renderOrphanedSidechains() {
    if (!this.orphanedSidechains || this.orphanedSidechains.length === 0) return '';
    
    return `
      <div class="orphaned-sidechains-section">
        <div class="orphaned-header">
          <span class="orphaned-icon">⚠️</span>
          <span class="orphaned-title">Unlinked Sub-Agent Tasks</span>
          <span class="orphaned-description">These sub-agent conversations could not be linked to a specific Task tool</span>
        </div>
        ${this.orphanedSidechains.map(({ sessionId, messages }) => 
          this.renderSidechainSection(messages, 0)
        ).join('')}
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
      <div class="thinking-block">
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
        
        // Update icon based on container type and state
        if (container.classList.contains('sidechain-container')) {
          icon.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
        } else {
          icon.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
        }
      });
    });
    
    // Also handle clicks on sidechain headers
    document.querySelectorAll('.sidechain-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.collapse-toggle')) return; // Already handled
        const container = header.closest('.sidechain-container');
        const icon = container.querySelector('.collapse-icon');
        
        container.classList.toggle('collapsed');
        icon.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
      });
    });
    
    // Note: Show more buttons are handled by event delegation in setupEventListeners()
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
  
  formatDuration(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${Math.round(duration / 1000)}s`;
    } else if (duration < 3600000) {
      return `${Math.round(duration / 60000)}m`;
    } else {
      return `${Math.round(duration / 3600000)}h`;
    }
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
    
    let content = toolResult.content || '';
    
    // First, handle the primary content with smart object detection
    const processedContent = this.processToolResultContent(content, toolResultData);
    
    // Format the main content based on its type and structure
    let html = this.formatProcessedContent(processedContent);
    
    // Add additional structured data if available and different from main content
    if (toolResultData && typeof toolResultData === 'object' && toolResultData !== null) {
      const additionalData = this.extractAdditionalData(toolResultData, processedContent);
      if (additionalData) {
        html += additionalData;
      }
    }
    
    return html;
  }
  
  processToolResultContent(content, toolResultData) {
    // Detect if content is a stringified object
    if (this.isStringifiedObject(content)) {
      return this.resolveStringifiedObject(content, toolResultData);
    }
    
    // Handle content that's already an object
    if (typeof content === 'object' && content !== null) {
      return this.processObjectContent(content);
    }
    
    // Handle string content that might contain structured data
    if (typeof content === 'string') {
      return this.processStringContent(content);
    }
    
    return {
      type: 'unknown',
      displayContent: String(content || 'No content'),
      warning: 'Unknown content type'
    };
  }
  
  isStringifiedObject(content) {
    if (typeof content !== 'string') return false;
    
    // Check for various forms of stringified objects
    const patterns = [
      /^\[object Object\]$/,
      /^\[object [A-Z][a-zA-Z]*\]$/,
      /^\[object [a-zA-Z]+\]$/,
      /^\{.*\}$/s,  // JSON-like
      /^\[.*\]$/s   // Array-like
    ];
    
    return patterns.some(pattern => pattern.test(content.trim()));
  }
  
  resolveStringifiedObject(content, toolResultData) {
    // If we have structured data, use it to resolve the object
    if (toolResultData && typeof toolResultData === 'object' && toolResultData !== null) {
      return this.processObjectContent(toolResultData);
    }
    
    // Try to parse if it looks like JSON
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        return this.processObjectContent(parsed);
      } catch {
        // Not valid JSON, treat as malformed
      }
    }
    
    return {
      type: 'error',
      displayContent: 'Unable to resolve object content',
      warning: 'Content appears to be a stringified object but no structured data is available to resolve it'
    };
  }
  
  processObjectContent(obj) {
    if (Array.isArray(obj)) {
      return this.processArrayContent(obj);
    }
    
    // Detect specific patterns and structures
    if (this.isTaskLikeResult(obj)) {
      return this.processTaskResult(obj);
    }
    
    if (this.isCommandLikeResult(obj)) {
      return this.processCommandResult(obj);
    }
    
    if (this.isFileLikeResult(obj)) {
      return this.processFileResult(obj);
    }
    
    // Generic object processing
    return this.processGenericObject(obj);
  }
  
  processArrayContent(arr) {
    // Check if it's a content array with text objects (Task-like)
    if (arr.every(item => item && typeof item === 'object' && item.type === 'text')) {
      const textContent = arr.map(item => item.text).join('\n\n');
      return {
        type: 'text',
        displayContent: textContent,
        metadata: { source: 'content-array', itemCount: arr.length }
      };
    }
    
    // Mixed array content
    const textItems = arr.filter(item => item && typeof item === 'object' && item.type === 'text');
    const otherItems = arr.filter(item => !textItems.includes(item));
    
    if (textItems.length > 0) {
      const textContent = textItems.map(item => item.text).join('\n\n');
      return {
        type: 'mixed-array',
        displayContent: textContent,
        metadata: { 
          textItems: textItems.length, 
          otherItems: otherItems.length,
          additionalData: otherItems.length > 0 ? otherItems : null
        }
      };
    }
    
    return {
      type: 'array',
      displayContent: JSON.stringify(arr, null, 2),
      metadata: { itemCount: arr.length, itemTypes: [...new Set(arr.map(item => typeof item))] }
    };
  }
  
  processStringContent(content) {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      return this.processObjectContent(parsed);
    } catch {
      // Not JSON, treat as plain text
      return {
        type: 'text',
        displayContent: content
      };
    }
  }
  
  isTaskLikeResult(obj) {
    return obj && (
      (Array.isArray(obj.content) && obj.content.some(item => item && item.type === 'text')) ||
      obj.summary || obj.sidechainId
    );
  }
  
  isCommandLikeResult(obj) {
    return obj && (obj.stdout !== undefined || obj.stderr !== undefined || obj.exitCode !== undefined);
  }
  
  isFileLikeResult(obj) {
    return obj && (obj.filename || obj.path || obj.size !== undefined || obj.modified);
  }
  
  processTaskResult(obj) {
    let mainContent = '';
    let metadata = {};
    
    // Extract main content
    if (Array.isArray(obj.content)) {
      const textContent = obj.content
        .filter(item => item && item.type === 'text')
        .map(item => item.text)
        .join('\n\n');
      mainContent = textContent || 'No text content found';
      metadata.contentItems = obj.content.length;
    } else if (obj.content) {
      mainContent = String(obj.content);
    }
    
    // Collect task-specific metadata
    ['summary', 'sidechainId', 'messagesInSidechain', 'tokensUsed', 'details'].forEach(key => {
      if (obj[key] !== undefined) {
        metadata[key] = obj[key];
      }
    });
    
    return {
      type: 'task-result',
      displayContent: mainContent,
      metadata: metadata
    };
  }
  
  processCommandResult(obj) {
    const parts = [];
    const metadata = {};
    
    if (obj.stdout) {
      parts.push({ type: 'stdout', content: obj.stdout });
    }
    if (obj.stderr) {
      parts.push({ type: 'stderr', content: obj.stderr });
    }
    
    ['exitCode', 'interrupted', 'timeout', 'command'].forEach(key => {
      if (obj[key] !== undefined) {
        metadata[key] = obj[key];
      }
    });
    
    return {
      type: 'command-result',
      displayContent: parts,
      metadata: metadata
    };
  }
  
  processFileResult(obj) {
    let mainContent = '';
    const metadata = {};
    
    // Extract file content if available
    if (obj.content) {
      mainContent = String(obj.content);
    } else if (obj.data) {
      mainContent = String(obj.data);
    }
    
    // Collect file metadata
    ['filename', 'path', 'size', 'modified', 'type', 'encoding'].forEach(key => {
      if (obj[key] !== undefined) {
        metadata[key] = obj[key];
      }
    });
    
    return {
      type: 'file-result',
      displayContent: mainContent,
      metadata: metadata
    };
  }
  
  processGenericObject(obj) {
    // Separate important data from metadata
    const importantKeys = ['content', 'data', 'result', 'output', 'value', 'message', 'text'];
    const metadataKeys = ['id', 'uuid', 'timestamp', 'version', 'type', 'status', 'meta', 'metadata'];
    
    let mainContent = '';
    const metadata = {};
    const additionalData = {};
    
    // Extract main content from important keys
    for (const key of importantKeys) {
      if (obj[key] !== undefined) {
        const value = obj[key];
        if (typeof value === 'string' || typeof value === 'number') {
          mainContent = String(value);
          break;
        } else if (typeof value === 'object') {
          mainContent = JSON.stringify(value, null, 2);
          break;
        }
      }
    }
    
    // Collect metadata and additional data
    Object.entries(obj).forEach(([key, value]) => {
      if (metadataKeys.includes(key.toLowerCase())) {
        metadata[key] = value;
      } else if (!importantKeys.includes(key)) {
        additionalData[key] = value;
      }
    });
    
    return {
      type: 'generic-object',
      displayContent: mainContent || JSON.stringify(obj, null, 2),
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      additionalData: Object.keys(additionalData).length > 0 ? additionalData : null,
      warning: !mainContent ? 'No recognizable content field found' : null
    };
  }
  
  formatProcessedContent(processedContent) {
    let html = '';
    
    // Add warning if present
    if (processedContent.warning) {
      html += `<div class="content-warning">⚠️ ${this.escapeHtml(processedContent.warning)}</div>`;
    }
    
    // Format based on content type
    switch (processedContent.type) {
      case 'text':
        html += this.formatLongContent(processedContent.displayContent, 1000);
        break;
        
      case 'command-result':
        html += this.formatCommandOutput(processedContent.displayContent);
        break;
        
      case 'task-result':
        html += this.formatLongContent(processedContent.displayContent, 1000);
        break;
        
      case 'file-result':
        if (processedContent.displayContent) {
          html += this.formatLongContent(processedContent.displayContent, 1000);
        } else {
          html += '<div class="no-content">File metadata only - no content to display</div>';
        }
        break;
        
      case 'mixed-array':
        html += this.formatLongContent(processedContent.displayContent, 1000);
        if (processedContent.metadata.additionalData) {
          html += this.formatCollapsibleSection('Additional Array Items', 
            JSON.stringify(processedContent.metadata.additionalData, null, 2));
        }
        break;
        
      case 'array':
      case 'generic-object':
        html += `<pre class="code-block">${this.escapeHtml(processedContent.displayContent)}</pre>`;
        break;
        
      case 'error':
      case 'unknown':
      default:
        html += `<div class="content-error">${this.escapeHtml(processedContent.displayContent)}</div>`;
        break;
    }
    
    // Add metadata section if present
    if (processedContent.metadata) {
      html += this.formatMetadataSection(processedContent.metadata);
    }
    
    return html;
  }
  
  formatCommandOutput(parts) {
    if (!Array.isArray(parts)) return '';
    
    let html = '';
    
    parts.forEach(part => {
      if (part.type === 'stdout' && part.content) {
        html += '<div class="command-stdout">';
        html += '<div class="output-label">Standard Output:</div>';
        html += this.formatLongContent(part.content, 1000);
        html += '</div>';
      } else if (part.type === 'stderr' && part.content) {
        html += '<div class="command-stderr">';
        html += '<div class="output-label error">Standard Error:</div>';
        html += `<pre class="code-block error">${this.escapeHtml(part.content)}</pre>`;
        html += '</div>';
      }
    });
    
    return html;
  }
  
  formatMetadataSection(metadata) {
    const items = Object.entries(metadata)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value, null, 2)
          : String(value);
        return `<div class="metadata-item"><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(displayValue)}</div>`;
      });
    
    if (items.length === 0) return '';
    
    return this.formatCollapsibleSection('Metadata', items.join(''));
  }
  
  formatCollapsibleSection(title, content) {
    const sectionId = 'section-' + Math.random().toString(36).substr(2, 9);
    
    return `
      <div class="collapsible-section" id="${sectionId}">
        <div class="section-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="section-toggle">▶</span>
          <span class="section-title">${this.escapeHtml(title)}</span>
        </div>
        <div class="section-content">
          ${content}
        </div>
      </div>
    `;
  }
  
  extractAdditionalData(toolResultData, processedContent) {
    // Don't show additional data if it was already used in main content
    if (processedContent.type === 'task-result' || 
        processedContent.type === 'command-result' || 
        processedContent.type === 'file-result') {
      return null; // These types already incorporate all relevant data
    }
    
    // For generic objects, show additional structured info
    if (processedContent.additionalData) {
      return this.formatCollapsibleSection('Additional Data', 
        `<pre class="code-block">${this.escapeHtml(JSON.stringify(processedContent.additionalData, null, 2))}</pre>`);
    }
    
    return null;
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
  
  formatLongContent(content, maxLength = 1000) {
    if (content.length <= maxLength) {
      return `<pre class="code-block">${this.escapeHtml(content)}</pre>`;
    }
    
    const contentId = 'content-' + Math.random().toString(36).substr(2, 9);
    const truncatedContent = content.substring(0, maxLength / 2) + '\n... (content truncated) ...\n' + content.substring(content.length - 100);
    
    return `
      <div class="expandable-content" id="${contentId}">
        <pre class="code-block content-preview">${this.escapeHtml(truncatedContent)}</pre>
        <pre class="code-block content-full" style="display: none;">${this.escapeHtml(content)}</pre>
        <button class="show-more-btn">Show more...</button>
      </div>
    `;
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
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      
      // Show feedback
      const feedbackElements = document.querySelectorAll('.copy-feedback');
      feedbackElements.forEach(el => {
        el.style.display = 'inline';
        setTimeout(() => {
          el.style.display = 'none';
        }, 2000);
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        // Show feedback
        const feedbackElements = document.querySelectorAll('.copy-feedback');
        feedbackElements.forEach(el => {
          el.style.display = 'inline';
          setTimeout(() => {
            el.style.display = 'none';
          }, 2000);
        });
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      
      document.body.removeChild(textArea);
    }
  }
}

// Make viewer globally accessible for onclick handlers
window.viewer = null;

document.addEventListener('DOMContentLoaded', () => {
  window.viewer = new ClaudeHistoryViewer();
});