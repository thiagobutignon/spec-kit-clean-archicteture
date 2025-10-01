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
    ],
  },

  // Configuração do boundaries plugin para validação arquitetural
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/**/domain/**', mode: 'folder' },
        { type: 'data', pattern: 'src/**/data/**', mode: 'folder' },
        { type: 'infra', pattern: 'src/**/infra/**', mode: 'folder' },
        { type: 'presentation', pattern: 'src/**/presentation/**', mode: 'folder' },
        { type: 'validation', pattern: 'src/**/validation/**', mode: 'folder' },
        { type: 'main', pattern: 'src/**/main/**', mode: 'folder' },
      ],
      'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts'],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          // Domain purity (NO imports allowed from other layers)
          { from: 'domain', allow: [] },

          // Data layer (only domain)
          { from: 'data', allow: ['domain'] },

          // Infrastructure layer (only domain)
          { from: 'infra', allow: ['domain'] },

          // Presentation layer (only domain)
          { from: 'presentation', allow: ['domain'] },

          // Validation layer (only domain)
          { from: 'validation', allow: ['domain'] },

          // Main can use everything
          { from: 'main', allow: ['*'] },
        ],
      }],
    },
  }
);