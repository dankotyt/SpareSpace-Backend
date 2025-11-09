import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    files: ['src/**/*.ts'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/internal-regex': '^src/',
    },
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    rules: {
      'curly': ['error', 'all'],
      '@typescript-eslint/no-unused-vars': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js модули
            'external', // Внешние пакеты (NestJS, TypeORM)
            'internal', // Внутренние модули (src/)
            'parent', // Родительские директории
            'sibling', // Сестринские файлы
            'index' // Barrel-файлы
          ],
          'newlines-between': 'always', // Пустая строка между группами
          alphabetize: { order: 'asc', caseInsensitive: true }, // Алфавитный порядок
        }
      ],
    },
  },
];