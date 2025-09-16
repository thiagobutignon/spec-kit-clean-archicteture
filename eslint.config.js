// eslint.config.js
import tseslint from 'typescript-eslint';

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
  }
);