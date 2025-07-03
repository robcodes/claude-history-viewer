# Claude History Viewer

A web-based viewer for Claude Code conversation history. Easily browse, search, and review your past conversations with Claude Code through a clean web interface.

## Disclaimer

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

## Security & Safety Best Practices

**⚠️ IMPORTANT: This tool is designed for LOCAL USE ONLY on your own machine.**

### Security Guidelines:
- **Keep it local**: By default, the server binds to `localhost` only. This means it's only accessible from your own machine.
- **Never expose to public internet**: Do not expose this server to the public internet without proper security measures (authentication, HTTPS, firewall rules, etc.).
- **Port security**: The default configuration uses localhost binding which prevents external access. If you change the host binding, ensure you understand the security implications.
- **Sensitive data**: Your Claude conversation history may contain sensitive information. Treat it with the same care as any personal data.

### Safe Usage:
```bash
# Safe (localhost only):
claude-history-viewer

# Safe (specific port, still localhost):
claude-history-viewer --port 8080

# UNSAFE - Do not use unless you understand the risks:
# claude-history-viewer --host 0.0.0.0  # Binds to all interfaces!
```

## Features

- 📋 Browse all your Claude Code conversations
- 🔍 Full-text search across all conversations
- 📊 View conversation statistics (messages, tokens, projects)
- 🚀 Smart port management to avoid conflicts
- 🎨 Clean, modern UI with syntax highlighting
- 📁 Automatically finds Claude history files

## Installation

```bash
npm install -g claude-history-viewer
```

## Usage

### Starting the Server
```bash
claude-history-viewer
```

This will:
1. Automatically find your Claude history files
2. Start a web server on an available port (default: 3456)
3. Open your browser to view the interface

### Stopping the Server
To stop the server, press `Ctrl+C` in the terminal where it's running.

### Running on a Specific Port
```bash
claude-history-viewer --port 8080
```

### Specifying a Different Claude Directory
```bash
claude-history-viewer --dir /path/to/your/claude/directory
```

### Options

```bash
claude-history-viewer --help

Options:
  -V, --version      output the version number
  -p, --port <number>  port to run the server on (default: "0")
  -d, --dir <path>   Claude config directory (defaults to CLAUDE_CONFIG_DIR or ~/.claude)
  --no-open          do not open browser automatically
  --host <host>      host to bind to (default: "localhost")
  --dev              run in development mode
  -h, --help         display help for command
```

### Examples

Run on a specific port:
```bash
claude-history-viewer --port 8080
```

Use a custom Claude directory:
```bash
claude-history-viewer --dir /path/to/claude/directory
```

Run without opening browser:
```bash
claude-history-viewer --no-open
```

## How it Works

Claude Code stores conversation history in JSONL files located in:
- Default: `~/.claude/projects/`
- Or the directory specified by `CLAUDE_CONFIG_DIR` environment variable

Each conversation is stored as a separate `.jsonl` file where each line contains a JSON object representing a message in the conversation.

## Development

To run in development mode:

```bash
git clone <repository>
cd claude-history-viewer
npm install
npm run dev
```

## Features in Detail

### Conversation List
- Shows all conversations sorted by last update
- Displays first message preview
- Shows message count and last update time
- Click to view full conversation

### Search
- Full-text search across all conversations
- Shows number of matches per conversation
- Highlights search results

### Conversation View
- Shows all messages in chronological order
- Syntax highlighting for code blocks
- Tool usage indicators
- Message timestamps
- Token usage statistics

## Troubleshooting

### "Claude history directory not found"
Make sure Claude Code is installed and has been used at least once. The viewer looks for history files in:
1. `CLAUDE_CONFIG_DIR` environment variable (if set)
2. `~/.claude/projects/`

### Port conflicts
The viewer automatically finds an available port. If you need a specific port, use the `--port` option.

### No conversations showing
Ensure you have used Claude Code and have conversation history. Check that the history files exist in the expected directory.