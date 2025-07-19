# Claude History Viewer

## Overview
Web-based viewer for Claude Code conversation history. Displays JSONL conversation files stored in `~/.claude/projects/` with a modern UI.

## Project Structure
```
claude-history-viewer/
├── bin/cli.js          # CLI entry point
├── src/
│   ├── server.js       # Express server & API endpoints
│   ├── historyParser.js # JSONL parsing & conversation processing
│   └── utils.js        # Port finding & utilities
├── public/
│   ├── index.html      # Main UI
│   ├── app.js          # Frontend logic
│   └── styles.css      # Styling
└── docs/
    └── jsonl-data-structure.md # Complete JSONL format documentation
```

## Key Features
- **Smart Port Management**: Auto-finds available ports (default: 3456)
- **Tool Flow Visualization**: Groups tool uses with their results
- **Developer Mode**: Toggle to show/hide technical details
- **Search**: Full-text search across all conversations
- **Expandable Content**: Show more/less for long outputs

## JSONL Structure Understanding
- Messages linked via `parentUuid` (conversation threading)
- Tool uses linked to results via `tool_use_id`
- Special handling for Task tool results (sub-agent summaries)
- Support for sidechains (sub-agent conversations)
- Thinking blocks (hidden by default)

## UI Improvements Made
1. Fixed `[object Object]` display for Task tool results
2. Seamless show more/less (single continuous block)
3. Visual tool flow connections
4. Proper metadata display with toggle
5. Modern card-based design

## Running
- **Replit**: Click "Run" button
- **Local**: `./run.sh` or `node claude-history-viewer/bin/cli.js`
- **Options**: `--port`, `--dir`, `--no-open`, `--host`

## Environment
- `CLAUDE_CONFIG_DIR`: Override default `~/.claude` location
- Configured for Replit deployment on port 3000

## Testing
To test: `curl http://localhost:3457/api/stats`

## Important Files
- `.replit`: Configured for auto-deployment
- `run.sh`: Helper script for easy execution
- `package.json`: npm dependencies (express, glob, etc.)


## Important
- This is an open source repo, please make sure to never commit or push private information like api keys or anything, if accidentally used for testing