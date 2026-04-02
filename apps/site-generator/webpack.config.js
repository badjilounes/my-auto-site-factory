const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/site-generator'),
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.json',
      optimization: false,
      outputHashing: 'none',
      externalDependencies: 'all',
    }),
  ],
};
