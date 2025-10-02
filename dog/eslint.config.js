// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.logs/**',
      'src/**/*.js',
      'src/**/*.d.ts'
    ]
  },
  {
    rules: {
      // Allow namespaces for Clean Architecture patterns (DOM002, DAT004)
      '@typescript-eslint/no-namespace': 'off'
    }
  }
);
