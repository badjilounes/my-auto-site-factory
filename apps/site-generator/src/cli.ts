/**
 * CLI mode: manually trigger site generation or outreach for a specific prospect.
 *
 * Usage:
 *   SITE_GENERATOR_MODE=cli PROSPECT_ID=abc123 nx serve site-generator
 *   SITE_GENERATOR_MODE=cli PROSPECT_ID=abc123 ACTION=outreach nx serve site-generator
 *
 * Useful for testing and manual operations.
 */

import { runSiteGenerationPipeline } from './pipeline';
import { runOutreachPipeline } from './outreach';

export async function runCliMode(): Promise<void> {
  const prospectId = process.env['PROSPECT_ID'];
  const action = process.env['ACTION'] || 'generate';

  if (!prospectId) {
    console.error('[CLI] Error: PROSPECT_ID environment variable is required');
    console.error('[CLI] Usage: SITE_GENERATOR_MODE=cli PROSPECT_ID=xxx nx serve site-generator');
    console.error('[CLI]        SITE_GENERATOR_MODE=cli PROSPECT_ID=xxx ACTION=outreach nx serve site-generator');
    process.exit(1);
  }

  console.log(`[CLI] Running ${action} for prospect ${prospectId}...`);

  try {
    if (action === 'outreach') {
      const result = await runOutreachPipeline(prospectId);
      console.log('\n[CLI] Outreach result:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const result = await runSiteGenerationPipeline(prospectId, (progress) => {
        console.log(`  [${progress.percent}%] ${progress.message}`);
      });
      console.log('\n[CLI] Generation result:');
      console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n[CLI] Done.');
    process.exit(0);
  } catch (error) {
    console.error('\n[CLI] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
