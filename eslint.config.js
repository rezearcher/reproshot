// Minimal flat config. The extension targets the browser/service-worker
// runtime; these globals are provided by Chrome, not bundled.
export default [
  {
    files: ['extension/**/*.js'],
    ignores: ['extension/ExtPay.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        chrome: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        screen: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        FileReader: 'readonly',
        OffscreenCanvas: 'readonly',
        createImageBitmap: 'readonly',
        getComputedStyle: 'readonly',
        setTimeout: 'readonly',
        importScripts: 'readonly',
        ExtPay: 'readonly',
        Image: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        requestAnimationFrame: 'readonly',
        console: 'readonly',
        ClipboardItem: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error'
    }
  }
];
