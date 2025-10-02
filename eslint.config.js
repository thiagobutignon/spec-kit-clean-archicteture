// eslint.config.js
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

// Usamos a função tseslint.config para construir nossa configuração de forma limpa
export default tseslint.config(
  // Primeiro, aplicamos as regras recomendadas para TypeScript
  ...tseslint.configs.recommended,

  // Em seguida, adicionamos um objeto de configuração para ignorar arquivos
  {
    ignores: [
      "node_modules/", // Sempre uma boa prática ignorar
      "validate-implementation.ts", // Ignora nosso script validador
      "execute-steps.ts", // Ignora nosso script executor
      "coverage/", // Ignore generated coverage reports
    ],
  },

  // Clean Architecture boundaries validation configuration
  // Enforces proper layer separation and dependency rules
  {
    plugins: {
      boundaries,
    },
    settings: {
      // Define architectural layers based on folder patterns
      // Each layer is detected by matching file paths against these patterns
      'boundaries/elements': [
        // Domain layer: Core business logic, entities, use cases (innermost layer)
        { type: 'domain', pattern: 'src/**/domain/**', mode: 'folder' },

        // Data layer: Repository implementations, data sources
        { type: 'data', pattern: 'src/**/data/**', mode: 'folder' },

        // Infrastructure layer: External services, frameworks, I/O
        { type: 'infra', pattern: 'src/**/infra/**', mode: 'folder' },

        // Presentation layer: Controllers, UI components, API handlers
        { type: 'presentation', pattern: 'src/**/presentation/**', mode: 'folder' },

        // Validation layer: Input validation, schema validation
        { type: 'validation', pattern: 'src/**/validation/**', mode: 'folder' },

        // Main layer: Dependency injection, application composition (outermost layer)
        { type: 'main', pattern: 'src/**/main/**', mode: 'folder' },
      ],
      // Ignore test files from boundary validation
      'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts'],
    },
    rules: {
      // Allow namespaces for Clean Architecture patterns (DOM002, DAT004)
      // Use cases and repositories use namespaces for Params and Result types
      '@typescript-eslint/no-namespace': 'off',

      // Enforce Clean Architecture dependency rules
      // Inner layers cannot depend on outer layers
      'boundaries/element-types': ['error', {
        default: 'disallow', // By default, all imports are disallowed unless explicitly allowed
        rules: [
          // Domain layer: Pure business logic - NO external dependencies allowed
          // This is the core of Clean Architecture - domain must be isolated
          { from: 'domain', allow: [] },

          // Data layer: Can only import from domain (repository interfaces, entities)
          { from: 'data', allow: ['domain'] },

          // Infrastructure layer: Can only import from domain (use case interfaces)
          { from: 'infra', allow: ['domain'] },

          // Presentation layer: Can only import from domain (controllers use domain interfaces)
          { from: 'presentation', allow: ['domain'] },

          // Validation layer: Can only import from domain (validates domain types)
          { from: 'validation', allow: ['domain'] },

          // Main layer: Can import from all layers (dependency injection and composition)
          // This is where everything is wired together
          { from: 'main', allow: ['*'] },
        ],
      }],
    },
  }
);