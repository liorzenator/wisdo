import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', 'test/**/*.ts'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
        },
    },
    {
        files: ['test/**/*.ts', 'test/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.mocha,
            },
        },
        rules: {
            'no-undef': 'off',
        },
    },
];
