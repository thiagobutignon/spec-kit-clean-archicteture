import path from 'path';

/**
 * Resolves the appropriate log directory based on the context.
 * If running within a spec structure, uses spec/XXX-feature/logs,
 * otherwise uses the legacy .logs structure.
 */
export function resolveLogDirectory(
  contextPath: string,
  subDirectory?: string
): string {
  // Validate input
  if (!contextPath) {
    throw new Error('Context path is required for resolveLogDirectory');
  }

  if (typeof contextPath !== 'string') {
    throw new Error(`Context path must be a string, received: ${typeof contextPath}`);
  }

  // Try to extract spec folder path (e.g., spec/001-user-registration or spec/1234-feature)
  const specMatch = contextPath.match(/(spec\/\d+-[\w-]+)/);

  if (specMatch) {
    // We're in a spec structure, use the spec's logs folder
    const baseLogDir = path.join(specMatch[1], 'logs');
    return subDirectory ? path.join(baseLogDir, subDirectory) : baseLogDir;
  }

  // Fallback to legacy structure
  const baseName = path.basename(contextPath, path.extname(contextPath));
  const baseLogDir = path.join(path.dirname(contextPath), '.logs', baseName);
  return subDirectory ? path.join(baseLogDir, subDirectory) : baseLogDir;
}

/**
 * Resolves the appropriate debug directory based on the context.
 * If running within a spec structure, uses spec/XXX-feature/debug,
 * otherwise uses the legacy .debug structure.
 */
export function resolveDebugDirectory(
  contextPath: string,
  subDirectory?: string
): string {
  // Validate input
  if (!contextPath) {
    throw new Error('Context path is required for resolveDebugDirectory');
  }

  if (typeof contextPath !== 'string') {
    throw new Error(`Context path must be a string, received: ${typeof contextPath}`);
  }

  // Try to extract spec folder path (e.g., spec/001-user-registration or spec/1234-feature)
  const specMatch = contextPath.match(/(spec\/\d+-[\w-]+)/);

  if (specMatch) {
    // We're in a spec structure, use the spec's debug folder
    const baseDebugDir = path.join(specMatch[1], 'debug');
    return subDirectory ? path.join(baseDebugDir, subDirectory) : baseDebugDir;
  }

  // Fallback to legacy structure
  const baseName = path.basename(contextPath, path.extname(contextPath));
  const baseDebugDir = path.join(path.dirname(contextPath), '.debug', baseName);
  return subDirectory ? path.join(baseDebugDir, subDirectory) : baseDebugDir;
}

/**
 * Resolves the appropriate data directory for RLHF metrics.
 * If running within a spec structure, uses spec/XXX-feature/metrics,
 * otherwise uses the legacy .rlhf structure.
 */
export function resolveRLHFDirectory(contextPath?: string): string {
  if (contextPath) {
    if (typeof contextPath !== 'string') {
      throw new Error(`Context path must be a string, received: ${typeof contextPath}`);
    }

    const specMatch = contextPath.match(/(spec\/\d+-[\w-]+)/);
    if (specMatch) {
      return path.join(specMatch[1], 'metrics');
    }
  }

  // Fallback to legacy structure
  return '.rlhf';
}