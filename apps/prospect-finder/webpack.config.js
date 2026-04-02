const { composePlugins, withNx } = require('@nx/webpack');
const { join } = require('path');

const workspaceRoot = join(__dirname, '../..');

module.exports = composePlugins(withNx(), (config) => {
  // Force webpack to bundle workspace libs (not treat as externals)
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@my-auto-site-factory/config': join(workspaceRoot, 'libs/config/src/index.ts'),
    '@my-auto-site-factory/core-database': join(workspaceRoot, 'libs/core/database/src/index.ts'),
    '@my-auto-site-factory/core-types': join(workspaceRoot, 'libs/core/types/src/index.ts'),
    '@my-auto-site-factory/utils': join(workspaceRoot, 'libs/utils/src/index.ts'),
    '@my-auto-site-factory/integrations-scrapers': join(workspaceRoot, 'libs/integrations/scrapers/src/index.ts'),
    '@my-auto-site-factory/integrations-claude': join(workspaceRoot, 'libs/integrations/claude/src/index.ts'),
    '@my-auto-site-factory/integrations-github': join(workspaceRoot, 'libs/integrations/github/src/index.ts'),
    '@my-auto-site-factory/integrations-vercel': join(workspaceRoot, 'libs/integrations/vercel/src/index.ts'),
    '@my-auto-site-factory/services-email': join(workspaceRoot, 'libs/services/email/src/index.ts'),
    '@my-auto-site-factory/services-payments': join(workspaceRoot, 'libs/services/payments/src/index.ts'),
  };

  // Remove @my-auto-site-factory/* from externals
  if (Array.isArray(config.externals)) {
    config.externals = config.externals.map((ext) => {
      if (typeof ext === 'function') {
        return (ctx, callback) => {
          if (ctx.request && ctx.request.startsWith('@my-auto-site-factory/')) {
            return callback();
          }
          return ext(ctx, callback);
        };
      }
      return ext;
    });
  }

  return config;
});
