# Claude Code Conversation History JSONL Data Structure Documentation

## Overview

Claude Code stores conversation history in JSONL (JSON Lines) format, where each line is a valid JSON object representing a single message in the conversation. The files are stored in:

- Default location: `~/.claude/projects/{project-path}/{session-id}.jsonl`
- Custom location: Can be configured via `CLAUDE_CONFIG_DIR` environment variable

Each conversation session has a unique UUID as its filename (e.g., `29a500cb-355a-42f7-bfa6-5a38075081c4.jsonl`).

## Key Discoveries from Analysis

- **Message Types**: user, assistant (no system messages found in analyzed files)
- **Content Types**: text, tool_use, tool_result, thinking (hidden from user)
- **Sidechains**: Messages can have `isSidechain: true` for sub-agent conversations
- **Linking**: Messages are linked via `parentUuid` and tool uses via `tool_use_id`
- **Metadata**: Rich metadata including timestamps, tokens, request IDs, and more

## File Format

- **Format**: JSONL (JSON Lines) - one JSON object per line
- **Encoding**: UTF-8
- **Line endings**: LF (Unix-style)
- **Each line**: A complete message object with metadata

## Message Structure

### Common Fields (All Messages)

Every message object contains these fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `uuid` | string | Unique identifier for this message | `"650d2d26-e71f-47c0-8eb1-00628566a083"` |
| `parentUuid` | string \| null | UUID of the parent message (null for first message) | `"650d2d26-e71f-47c0-8eb1-00628566a083"` |
| `type` | string | Message type: "user" or "assistant" | `"user"` |
| `timestamp` | string | ISO 8601 timestamp | `"2025-07-03T13:42:09.815Z"` |
| `sessionId` | string | Session UUID (matches filename) | `"29a500cb-355a-42f7-bfa6-5a38075081c4"` |
| `version` | string | Claude Code version | `"1.0.41"` |
| `isSidechain` | boolean | Whether this is a sidechain conversation | `false` |
| `userType` | string | User type identifier | `"external"` |
| `cwd` | string | Current working directory | `"/home/runner/workspace"` |
| `message` | object | The actual message content | See below |

### Message Types

#### 1. User Messages

User messages contain the user's input to Claude. They can be regular user input or tool results.

**Basic User Message:**
```json
{
  "parentUuid": null,
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/runner/workspace",
  "sessionId": "29a500cb-355a-42f7-bfa6-5a38075081c4",
  "version": "1.0.41",
  "type": "user",
  "message": {
    "role": "user",
    "content": "User's message text here..."
  },
  "uuid": "650d2d26-e71f-47c0-8eb1-00628566a083",
  "timestamp": "2025-07-03T13:42:09.815Z"
}
```

**Tool Result Message:**
```json
{
  "parentUuid": "9b66f080-5709-4f0b-8467-a4cb3a8f4fbe",
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "tool_result",
        "content": "Result content or error message",
        "is_error": true,
        "tool_use_id": "toolu_012cNktktoMzcyirCeipS6vj"
      }
    ]
  },
  "toolUseResult": "Error: The user doesn't want to proceed...",
  "uuid": "9212a24c-f28a-4e0d-aded-3bc69cc271cd",
  "timestamp": "2025-07-03T13:42:33.599Z"
}
```

**Content Types:**
- **String**: Simple text content
- **Array**: Can contain multiple content items (text, tool_result)
- **Tool Results**: Include tool_use_id, content, and is_error flag

#### 2. Assistant Messages

Assistant messages contain Claude's responses, including text, tool uses, and internal thinking.

**Text Response:**
```json
{
  "parentUuid": "650d2d26-e71f-47c0-8eb1-00628566a083",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/runner/workspace",
  "sessionId": "29a500cb-355a-42f7-bfa6-5a38075081c4",
  "version": "1.0.41",
  "message": {
    "id": "msg_01YP4yvJQXAqKK5y6UZzsphx",
    "type": "message",
    "role": "assistant",
    "model": "claude-opus-4-20250514",
    "content": [
      {
        "type": "text",
        "text": "Assistant's response text..."
      }
    ],
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 4,
      "cache_creation_input_tokens": 13732,
      "cache_read_input_tokens": 0,
      "output_tokens": 8,
      "service_tier": "standard"
    }
  },
  "requestId": "req_011CQkBXpcvnxinvwCP2wQrs",
  "type": "assistant",
  "uuid": "c6c5b7fc-fea9-4730-848d-8707849d2952",
  "timestamp": "2025-07-03T13:42:13.768Z"
}
```

**Tool Use Message:**
```json
{
  "message": {
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_012cNktktoMzcyirCeipS6vj",
        "name": "WebFetch",
        "input": {
          "url": "https://docs.anthropic.com/en/docs/claude-code/overview",
          "prompt": "What is Claude Code?"
        }
      }
    ]
  }
}
```

**Thinking Message (Hidden from User):**
```json
{
  "message": {
    "content": [
      {
        "type": "thinking",
        "thinking": "Internal reasoning here...",
        "signature": "cryptographic_signature_here"
      }
    ]
  }
}
```

**Additional Fields:**
- `requestId`: Unique request identifier
- `message.id`: Message ID from Claude API
- `message.model`: Model used for generation
- `message.usage`: Detailed token usage statistics

### Content Item Types

#### 1. Text Content
```json
{
  "type": "text",
  "text": "The actual text content"
}
```

#### 2. Tool Use Content
```json
{
  "type": "tool_use",
  "id": "toolu_012cNktktoMzcyirCeipS6vj",
  "name": "WebFetch",
  "input": {
    "url": "https://example.com",
    "prompt": "What is this about?"
  }
}
```

#### 3. Tool Result Content
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_012cNktktoMzcyirCeipS6vj",
  "is_error": true,
  "content": "Error message or result content"
}
```

### Special Message Features

#### Sidechain Messages
Sidechain messages represent sub-agent conversations spawned from the main conversation:

```json
{
  "parentUuid": null,  // Note: null for first message in sidechain
  "isSidechain": true,
  "userType": "external",
  "cwd": "/home/runner/workspace/claude-history-viewer",
  "sessionId": "7443eeb4-5c0d-4267-a78e-cadc3db204b7",
  "type": "user",
  "message": {
    "role": "user",
    "content": "Task description for sub-agent..."
  }
}
```

#### Tool Result Messages
Tool results are returned as user messages with special content:

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "tool_result",
        "content": "Result content or error message",
        "is_error": false,
        "tool_use_id": "toolu_012cNktktoMzcyirCeipS6vj"
      }
    ]
  },
  "toolUseResult": {
    "stdout": "Command output",
    "stderr": "",
    "interrupted": false,
    "isImage": false
  }
}
```

#### Interrupt Messages
When a user interrupts a tool use:

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "[Request interrupted by user for tool use]"
      }
    ]
  }
}
```

## Message Relationships and Flow

### Parent-Child Relationships
Messages form a linked list through the `parentUuid` field:
- First message has `parentUuid: null`
- Each subsequent message references its parent's UUID
- This creates a conversation thread

### Tool Use Flow
1. **Assistant sends tool_use**: Contains tool name, input, and unique `id`
2. **User returns tool_result**: References the tool use via `tool_use_id`
3. **Assistant processes result**: Continues based on tool output

### Sidechain Flow
1. **Main conversation spawns sub-agent**: Via Task tool or similar
2. **Sidechain messages**: Have `isSidechain: true` and their own thread
3. **Results return to main**: Via tool_result in main conversation

### Visual Representation
```
Main Thread:                     Sidechain:
User (parent: null) ─────┐       
Assistant ───────────────┤       
Assistant (tool_use) ────┤       
                         ├────→  User (sidechain, parent: null)
                         │       Assistant (sidechain)
                         │       User (tool_result, sidechain)
                         │       Assistant (sidechain)
User (tool_result) ←─────┘       
Assistant ───────────────┐       
```

## Sidechain Relationships and Task Tool Integration

### Overview
Sidechains are sub-agent conversations spawned from the main conversation thread, typically via the Task tool. They represent independent work performed by a sub-agent with fresh context, and their results are returned to the main conversation.

### Key Characteristics of Sidechains

1. **Identification**: All sidechain messages have `"isSidechain": true`
2. **Threading**: Sidechains form their own conversation thread with parentUuid relationships
3. **First Message**: The first sidechain message has `"parentUuid": null` (not linked to main thread)
4. **Same Session**: Sidechains share the same `sessionId` as the main conversation
5. **Ordering**: Sidechain messages are interleaved with main thread messages in the JSONL file

### Task Tool Flow

The complete flow when using the Task tool involves these steps:

#### 1. Main Thread: Task Tool Invocation
```json
{
  "parentUuid": "3295c45a-8fd9-4ac3-b393-5b0f5565d0c8",
  "isSidechain": false,
  "type": "assistant",
  "message": {
    "content": [{
      "type": "tool_use",
      "id": "toolu_0115f6FVpQQoCt4jmAMQehwi",
      "name": "Task",
      "input": {
        "prompt": "Your task is to click the profile avatar on fuzzycode.dev...",
        "description": "Test clicking profile on fuzzycode.dev"
      }
    }]
  },
  "uuid": "f63f0119-70eb-4a84-ba7e-1b6e70719757"
}
```

#### 2. Sidechain: First Message (Task Assignment)
```json
{
  "parentUuid": null,  // Note: null, not linked to main thread
  "isSidechain": true,
  "type": "user",
  "message": {
    "role": "user",
    "content": "Your task is to click the profile avatar on fuzzycode.dev..."
  },
  "uuid": "21c97710-2b33-4a4d-8ca1-8fad70d5ab78",
  "timestamp": "2025-07-12T14:27:37.503Z"
}
```

#### 3. Sidechain: Sub-agent Conversation
Multiple messages follow in the sidechain as the sub-agent works:
```json
// Sub-agent response
{
  "parentUuid": "21c97710-2b33-4a4d-8ca1-8fad70d5ab78",
  "isSidechain": true,
  "type": "assistant",
  "message": {
    "content": [{"type": "text", "text": "I'll help you click..."}]
  }
}

// Tool uses and results within sidechain
{
  "parentUuid": "cb8f7451-e0cc-4760-ade2-1475e3d414e6",
  "isSidechain": true,
  "type": "assistant",
  "message": {
    "content": [{
      "type": "tool_use",
      "name": "mcp__browserbase__browserbase_session_create"
    }]
  }
}
```

#### 4. Sidechain: Final Summary
The last assistant message in the sidechain typically contains a comprehensive summary:
```json
{
  "parentUuid": "8d790d2b-4415-4746-9dd7-afe66b7cba0c",
  "isSidechain": true,
  "type": "assistant",
  "message": {
    "content": [{
      "type": "text",
      "text": "## Summary Report\n\nI successfully completed the full login flow..."
    }]
  },
  "uuid": "b48da4a0-101d-42be-be09-f04d89e06377"
}
```

#### 5. Main Thread: Task Result
The Task tool result is returned to the main thread:
```json
{
  "parentUuid": "f63f0119-70eb-4a84-ba7e-1b6e70719757",
  "isSidechain": false,
  "type": "user",
  "message": {
    "role": "user",
    "content": [{
      "tool_use_id": "toolu_0115f6FVpQQoCt4jmAMQehwi",
      "type": "tool_result",
      "content": [{"type": "text", "text": "## Summary Report\n\nI successfully completed..."}]
    }]
  },
  "toolUseResult": {
    "content": [{"type": "text", "text": "## Summary Report..."}],
    "totalDurationMs": 180653,
    "totalTokens": 28695,
    "totalToolUseCount": 18,
    "usage": {...},
    "wasInterrupted": false
  }
}
```

### Important Patterns

1. **No Direct Linking**: Sidechains are NOT directly linked to the main thread via parentUuid
2. **Implicit Relationship**: The relationship is implicit through:
   - Temporal ordering (sidechain follows Task tool use)
   - Same sessionId
   - Task tool_use_id matches the tool_result that returns the summary
   
3. **Content Duplication**: The sidechain's final summary is typically duplicated in:
   - The last assistant message in the sidechain
   - The tool_result content in the main thread
   - The toolUseResult field (sometimes with additional metadata)

4. **Multiple Sidechains**: A conversation can have multiple sidechains from different Task invocations

### Displaying Sidechains in UI

#### Recommended Approach

1. **Identify Sidechain Blocks**:
   ```javascript
   function identifySidechains(messages) {
     const sidechains = [];
     let currentSidechain = null;
     
     for (const msg of messages) {
       if (msg.isSidechain) {
         if (!currentSidechain || msg.parentUuid === null) {
           // Start of new sidechain
           currentSidechain = {
             id: msg.uuid,
             startTime: msg.timestamp,
             messages: [msg]
           };
           sidechains.push(currentSidechain);
         } else {
           currentSidechain.messages.push(msg);
         }
       } else if (currentSidechain) {
         // End of sidechain
         currentSidechain.endTime = messages[messages.indexOf(msg) - 1].timestamp;
         currentSidechain = null;
       }
     }
     return sidechains;
   }
   ```

2. **Link Sidechains to Task Tools**:
   ```javascript
   function linkSidechainsToTasks(messages, sidechains) {
     for (const sidechain of sidechains) {
       // Find Task tool use that preceded this sidechain
       const taskToolUse = findPrecedingTaskToolUse(messages, sidechain.startTime);
       if (taskToolUse) {
         sidechain.taskToolUseId = taskToolUse.toolUseId;
         sidechain.taskDescription = taskToolUse.input.description;
       }
     }
   }
   ```

3. **Display Options**:
   - **Inline Collapsible**: Show sidechain as collapsible section after Task tool
   - **Separate Panel**: Display sidechain in side panel when Task is selected
   - **Modal/Popup**: Open sidechain in modal for detailed view
   - **Summary Only**: Show only the final summary with option to expand

### Edge Cases and Considerations

1. **Interrupted Sidechains**: Handle cases where Task is interrupted
2. **Empty Sidechains**: Some Tasks might not generate sidechain messages
3. **Large Sidechains**: Performance considerations for long sub-agent conversations
4. **Nested Tasks**: A sidechain could theoretically spawn its own sub-tasks
5. **Error Handling**: Sidechain errors should be clearly distinguished from main thread errors

### Example Implementation

```javascript
class SidechainManager {
  constructor(messages) {
    this.messages = messages;
    this.sidechains = this.extractSidechains();
  }
  
  extractSidechains() {
    const sidechains = new Map();
    let currentSidechain = null;
    
    this.messages.forEach((msg, index) => {
      if (msg.isSidechain) {
        if (!currentSidechain || msg.parentUuid === null) {
          currentSidechain = {
            id: crypto.randomUUID(),
            messages: [],
            startIndex: index,
            startTime: msg.timestamp
          };
        }
        currentSidechain.messages.push(msg);
      } else if (currentSidechain) {
        // Sidechain ended
        currentSidechain.endIndex = index - 1;
        currentSidechain.endTime = this.messages[index - 1].timestamp;
        
        // Find associated Task tool
        const taskTool = this.findAssociatedTaskTool(currentSidechain);
        if (taskTool) {
          sidechains.set(taskTool.id, currentSidechain);
        }
        
        currentSidechain = null;
      }
    });
    
    return sidechains;
  }
  
  findAssociatedTaskTool(sidechain) {
    // Look backwards from sidechain start for Task tool use
    for (let i = sidechain.startIndex - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.type === 'assistant' && msg.message.content) {
        const toolUse = msg.message.content.find(
          c => c.type === 'tool_use' && c.name === 'Task'
        );
        if (toolUse) return toolUse;
      }
    }
    return null;
  }
  
  getSidechainForTaskTool(toolUseId) {
    return this.sidechains.get(toolUseId);
  }
}
```

## Token Usage and Metadata

### Token Usage Tracking
Assistant messages include detailed token usage:
```json
"usage": {
  "input_tokens": 4,
  "cache_creation_input_tokens": 13732,
  "cache_read_input_tokens": 0,
  "output_tokens": 8,
  "service_tier": "standard"
}
```

### Additional Metadata Fields
- **requestId**: Unique identifier for API requests (assistant messages)
- **toolUseResult**: Additional data for tool results (stdout, stderr, etc.)
- **stop_reason**: Why the assistant stopped generating (null, "tool_use", etc.)
- **stop_sequence**: If stopped due to a specific sequence
- **signature**: Cryptographic signature for thinking blocks

## UI Display Recommendations

### 1. Conversation Thread Display
- **Main Thread**: Show primary conversation flow
- **Sidechains**: Display as collapsible sub-threads or separate panels
- **Tool Flow**: Connect tool uses to their results with visual lines/arrows
- **Timestamps**: Show relative times for recent, absolute for older

### 2. Message Rendering
- **User Messages**: 
  - Regular: Simple text with user avatar
  - Tool Results: Show with tool icon, success/error state
  - Interrupts: Special styling for "[Request interrupted]"
  
- **Assistant Messages**: 
  - Text: Render with markdown support
  - Tool Uses: Collapsible panels showing tool name, inputs
  - Thinking: Hidden by default (developer mode to show)
  - Multiple Content: Handle arrays properly

### 3. Tool Use Visualization
- **Tool Card**: Show tool name, icon, and status
- **Input/Output**: Formatted JSON or custom UI per tool type
- **Error States**: Red borders, error icons, clear messages
- **Execution Time**: Show if available from timestamps
- **Link to Result**: Visual connection to corresponding tool_result

### 4. Enhanced Metadata Display
- **Token Usage**: Progress bars for input/output/cache tokens
- **Model Info**: Show model name and version prominently
- **Working Directory**: Show path with folder icon
- **Request ID**: Collapsible debug info
- **Session Info**: Link to full conversation

### 5. Advanced Search and Filters
- **Content Search**: Full-text with highlighting
- **Tool Search**: Find by tool name or inputs
- **Error Filter**: Show only failed tool uses
- **Sidechain Filter**: Show/hide sub-agent conversations
- **Token Filter**: Find high-token messages
- **Date Range**: Calendar picker for time filtering

### 6. Performance Optimizations
- **Virtual Scrolling**: For conversations > 100 messages
- **Lazy Loading**: Load message details on expand
- **Message Grouping**: Group rapid exchanges
- **Caching**: Store parsed JSON in IndexedDB
- **Streaming**: Load JSONL progressively for large files

### 7. Export and Analysis
- **Markdown Export**: Preserve formatting and structure
- **JSON Export**: Full data with metadata
- **Cost Analysis**: Calculate API costs from tokens
- **Tool Usage Report**: Statistics on tool usage
- **Conversation Summary**: AI-generated summary
- **Code Extraction**: Pull out all code blocks

## Error Handling and Edge Cases

### Common Error Scenarios
1. **Malformed JSON**: Validate each line, skip invalid
2. **Missing Fields**: Use defaults for optional fields
3. **Broken Links**: Handle orphaned messages gracefully
4. **Tool Mismatches**: Tool results without tool uses
5. **Incomplete Messages**: EOF during write
6. **Large Files**: Files > 100MB need streaming

### Data Validation
```javascript
// Validate message structure
function validateMessage(msg) {
  const required = ['uuid', 'type', 'timestamp', 'message'];
  const valid = required.every(field => field in msg);
  
  // Check message content
  if (valid && msg.message) {
    if (!msg.message.role) return false;
    if (msg.type === 'assistant' && !msg.message.id) return false;
  }
  
  return valid;
}
```

### Recovery Strategies
- **Orphaned Messages**: Group at conversation end
- **Missing Tool Results**: Show as "pending"
- **Corrupt Lines**: Log and continue parsing
- **Version Mismatch**: Attempt compatibility mode

## Future Compatibility and Extensibility

### Version Handling
The `version` field (e.g., "1.0.41") indicates Claude Code version:
- **Major Changes**: New message types or structure
- **Minor Changes**: New fields or content types
- **Patch Changes**: Bug fixes, no structure changes

### Extensibility Considerations
1. **Unknown Content Types**: Render as raw JSON
2. **New Message Types**: Display with generic handler
3. **Additional Fields**: Store but don't require
4. **Schema Evolution**: Migrate old formats on read

### Recommended Implementation
```javascript
class MessageParser {
  constructor(version) {
    this.handlers = this.getHandlersForVersion(version);
  }
  
  parseContent(content) {
    if (Array.isArray(content)) {
      return content.map(item => {
        const handler = this.handlers[item.type] || this.defaultHandler;
        return handler(item);
      });
    }
    return this.handlers.text({ type: 'text', text: content });
  }
}
```

## Complete Message Type Reference

### Content Types Found
1. **text**: Regular text content
2. **tool_use**: Tool invocation with inputs
3. **tool_result**: Results from tool execution
4. **thinking**: Internal reasoning (hidden)

### Message Roles
- **user**: User or tool result messages
- **assistant**: Claude's responses

### Special Fields
- **isSidechain**: Indicates sub-agent conversation
- **toolUseResult**: Extended tool result data
- **thinking**: Internal reasoning with signature
- **requestId**: API request tracking

### Tool-Specific Data
Different tools return different result structures:
- **Bash**: stdout, stderr, interrupted, isImage
- **Read**: file content, line numbers
- **WebSearch**: search results, duration
- **Task**: spawns sidechain conversation, returns complex result object
- **TodoWrite**: oldTodos, newTodos arrays
- **Write/Edit**: file path, content, patches

#### Task Tool Results
The Task tool is special because it launches sub-agents to complete complex tasks. Its results can be stored in two ways:

1. **In tool_result content** (string): A summary of what was accomplished
2. **In toolUseResult field** (object): Additional structured data about the task

Example Task tool result structure:
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "tool_result",
        "tool_use_id": "toolu_01XYZ...",
        "content": "Successfully analyzed the JSONL file structure and created comprehensive documentation.",
        "is_error": false
      }
    ]
  },
  "toolUseResult": {
    "summary": "Analyzed Claude Code conversation history format",
    "details": {
      "filesAnalyzed": 3,
      "patternsFound": ["user messages", "assistant messages", "tool flows"],
      "documentationCreated": true
    },
    "sidechainId": "7443eeb4-5c0d-4267-a78e-cadc3db204b7",
    "messagesInSidechain": 15,
    "tokensUsed": 4532
  }
}
```

When the `toolUseResult` field contains an object (rather than a string), it often includes:
- **summary**: High-level description of what was accomplished
- **details**: Structured information about the task completion
- **sidechainId**: Reference to the sub-agent conversation
- **messagesInSidechain**: Number of messages in the sub-conversation
- **tokensUsed**: Tokens consumed by the sub-agent

## Real-World Examples

### Complete Tool Use Flow Example
```json
// 1. Assistant decides to use a tool
{
  "type": "assistant",
  "message": {
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_01ARN1NSopn6f8eseGkAdtFZ",
        "name": "TodoWrite",
        "input": {
          "todos": [
            {"id": "1", "content": "Initialize Node.js project", "status": "completed", "priority": "high"}
          ]
        }
      }
    ]
  }
}

// 2. User message with tool result
{
  "type": "user",
  "message": {
    "content": [
      {
        "type": "tool_result",
        "tool_use_id": "toolu_01ARN1NSopn6f8eseGkAdtFZ",
        "content": "Todos have been modified successfully.",
        "is_error": false
      }
    ]
  },
  "toolUseResult": {
    "oldTodos": [...],
    "newTodos": [...]
  }
}
```

### Thinking Block Example
```json
{
  "message": {
    "content": [
      {
        "type": "thinking",
        "thinking": "The user wants me to use a subagent to analyze the jsonl file structure...",
        "signature": "EsoDCkYIBRgCKkCRoj7VhcnV94MFdjAH..."
      }
    ]
  }
}
```

### Error Tool Result Example
```json
{
  "message": {
    "content": [
      {
        "type": "tool_result",
        "content": "The user doesn't want to proceed with this tool use.",
        "is_error": true,
        "tool_use_id": "toolu_012cNktktoMzcyirCeipS6vj"
      }
    ]
  },
  "toolUseResult": "Error: The user doesn't want to proceed..."
}
```