# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-07-15

### Fixed
- 🐛 **Critical Fix**: Sidechain messages from Task tools are now properly displayed
  - Previously, all Task tool results (sub-agent conversations) were completely missing from the UI
  - Replaced sessionId-based grouping with continuous block detection
  - Implemented position-based linking between Task tools and their sidechains
  - Fixed issue where messages like UUID `ea1e47a9-b497-4c88-9ca8-b6a62887844f` were filtered out but never shown
  
- 🐛 **Major Fix**: Eliminated all "[object Object]" display issues
  - Added comprehensive object detection for all stringified object patterns
  - Implemented smart pattern-based content processing
  - Complex tool results (like browserbase JavaScript execution) now display properly
  - Added user-friendly warnings for unrecognized object structures

### Added
- ✨ Pattern-based content processing system for better tool result display
- ✨ Collapsible metadata sections for cleaner information hierarchy
- ✨ Warning system that explains when content can't be fully parsed
- ✨ Support for multiple sidechain blocks in a single conversation
- ✨ Enhanced object display with smart content extraction

### Improved
- 📊 Better visual organization with primary content vs metadata separation
- 🎨 New CSS styling for unknown object warnings and collapsible sections
- 🔧 More maintainable architecture without tool-specific hardcoding
- 🚀 Significantly improved transparency into Task tool operations

## [0.1.1] - 2025-07-03

### Added
- Display full JSONL file path in conversation header
- Copy to clipboard button for file paths
- Visual feedback when copying (shows "✅ Copied!" for 2 seconds)
- Responsive mobile design for file path display

### Improved
- Better visual separation with a border between conversation details and file path
- Monospace font for file paths for better readability
- Hover effects and animations for copy button

## [0.1.0] - 2025-07-03

### Initial Release
- Browse all Claude Code conversations
- Full-text search across conversations
- View conversation statistics (messages, tokens, projects)
- Smart port management to avoid conflicts
- Clean, modern UI with syntax highlighting
- Automatically finds Claude history files
- Developer mode to show/hide technical details
- Collapsible sidebar for better space utilization
- Tool flow visualization
- Support for sidechains (sub-agent conversations)