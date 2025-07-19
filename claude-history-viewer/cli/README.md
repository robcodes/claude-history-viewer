# Claude History Viewer CLI Tools

## claude-tail

A beautiful command-line viewer for Claude Code conversation history files.

### Installation

```bash
# Make sure the script is executable
chmod +x claude-tail

# Optionally, add to your PATH
ln -s $(pwd)/claude-tail ~/.local/bin/claude-tail
```

### Usage

```bash
# View the most recent conversation
./claude-tail

# View last 20 messages
./claude-tail -n 20

# Follow mode (like tail -f)
./claude-tail -f

# Show all content with metadata
./claude-tail -a

# Custom formatting
./claude-tail -l 500  # Limit content to 500 chars
./claude-tail -p      # Preserve newlines (default: enabled)
```

### Options

- `-n NUM` - Number of messages to show (default: 10)
- `-f` - Follow mode (like tail -f)
- `-s` - Show sidechains
- `-t` - Show thinking blocks
- `-m` - Show metadata (tokens, timestamps)
- `-a` - Show all content types (sidechains + thinking + metadata)
- `-l NUM` - Max content length (default: 300000, use 0 for no limit)
- `-p` - Preserve newlines (default: enabled)
- `--no-color` - Disable colors (useful for piping to files or other tools)
- `--help` - Show help

### Features

- **Smart file selection** - Automatically finds the most recent conversation, skipping summary-only files
- **Color-coded messages** - Different colors for users, Claude, tools, results, errors, sidechains, and thinking blocks
- **Tool visualization** - Shows tool names with relevant parameters (commands, file paths, URLs)
- **Flexible formatting** - Control content length and newline handling
- **CLAUDE_CONFIG_DIR support** - Respects custom configuration directories

### Examples

```bash
# View full conversation with preserved formatting
./claude-tail -l 0 -p

# Compact view (single lines)
./claude-tail -l 150

# Follow a specific conversation
./claude-tail -f ~/.claude/projects/myproject/session-id.jsonl

# Debug mode with everything visible
./claude-tail -a -l 0

# Export to plain text file
./claude-tail --no-color > conversation.txt

# Pipe to other tools (e.g., grep)
./claude-tail --no-color | grep "ERROR"
```

### Message Types

The viewer displays different message types with distinct styling:
- 👤 **USER** - User messages (blue background)
- 🤖 **CLAUDE** - Assistant responses (green background)
- 🔧 **Tool names** - Tool invocations (orange background)
- ✅ **RESULT** - Successful tool results (purple background)
- ❌ **ERROR** - Failed tool results (red background)
- 🔗 **SUB-AGENT/SUB-CLAUDE** - Sidechain messages (gray background)
- 💭 **THINKING** - Internal reasoning (dark gray, hidden by default)