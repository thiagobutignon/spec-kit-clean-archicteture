/**
 * Scope Extractor
 * Extracts architectural layer scope from file paths for conventional commits
 */
/**
 * Extracts the architectural layer from a file path
 * @param filePath - The file path to analyze
 * @returns The architectural scope (layer) extracted from the path
 *
 * @example
 * extractScope('product-catalog/src/features/.../domain/models/product.ts') // 'domain'
 * extractScope('product-catalog/src/features/.../data/usecases/create-product.ts') // 'data'
 * extractScope('src/infra/database/repositories/user-repository.ts') // 'infra'
 */
export function extractScope(filePath) {
    if (!filePath) {
        return 'core';
    }
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Extract layer from path - match the layer folder in the path
    const layerMatch = normalizedPath.match(/\/(domain|data|infra|infrastructure|presentation|main)\//i);
    if (layerMatch) {
        const layer = layerMatch[1].toLowerCase();
        // Map 'infrastructure' to 'infra'
        if (layer === 'infrastructure') {
            return 'infra';
        }
        return layer;
    }
    // Fallback: try to detect from common patterns
    if (normalizedPath.includes('/models/') || normalizedPath.includes('/entities/') || normalizedPath.includes('/value-objects/')) {
        return 'domain';
    }
    if (normalizedPath.includes('/usecases/') || normalizedPath.includes('/use-cases/')) {
        return 'data';
    }
    if (normalizedPath.includes('/repositories/') || normalizedPath.includes('/adapters/')) {
        return 'infra';
    }
    if (normalizedPath.includes('/controllers/') || normalizedPath.includes('/components/')) {
        return 'presentation';
    }
    if (normalizedPath.includes('/factories/') || normalizedPath.includes('/composition/')) {
        return 'main';
    }
    return 'core';
}
/**
 * Validates if a scope is a valid architectural layer
 */
export function isValidScope(scope) {
    return ['domain', 'data', 'infra', 'presentation', 'main', 'core'].includes(scope);
}
