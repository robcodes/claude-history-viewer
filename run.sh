#!/bin/bash

# Script to run claude-history-viewer
echo "Starting Claude History Viewer..."

cd claude-history-viewer

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the viewer
echo "Starting server..."
node bin/cli.js "$@"