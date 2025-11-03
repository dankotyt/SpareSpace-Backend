module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',    // Node.js модули (если используются)
          'external',   // Внешние пакеты (NestJS, TypeORM)
          'internal',   // Внутренние модули (сервисы, entities)
          'parent',     // Родительские директории
          'sibling',    // Сестринские файлы
          'index'       // Barrel-файлы
        ],
        'newlines-between': 'always',  // Пустая строка между группами
        alphabetize: { order: 'asc', caseInsensitive: true },  // Алфавитный порядок в группе
      }
    ],
    '@typescript-eslint/no-unused-vars': 'error',
    // Другие правила по необходимости
  },
  settings: {
    'import/internal-regex': '^src/',  // Определение "internal" для вашего проекта
  },
};
