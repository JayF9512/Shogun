/* eslint-disable no-console */
import { validateContent } from './index';

/** CLI entry: `npm run validate`. Exits non-zero on any content error. */
const result = validateContent();

console.log('Season Zero content validation');
console.log('==============================');
for (const [k, v] of Object.entries(result.counts)) {
  console.log(`  ${k.padEnd(18)} ${v}`);
}

if (result.ok) {
  console.log('\n✅ All content valid.');
  process.exit(0);
} else {
  console.error(`\n❌ ${result.errors.length} error(s):`);
  for (const e of result.errors) console.error('  - ' + e);
  process.exit(1);
}
