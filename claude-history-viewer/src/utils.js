import portfinder from 'portfinder';

export async function findAvailablePort(preferredPort = 0) {
  if (preferredPort === 0) {
    preferredPort = 3456;
  }
  
  portfinder.basePort = preferredPort;
  
  try {
    const port = await portfinder.getPortPromise();
    return port;
  } catch (error) {
    throw new Error(`Unable to find available port starting from ${preferredPort}`);
  }
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatTokenCount(tokens) {
  if (tokens > 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}