import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { resolveFiles } from 'fumadocs-mdx';

// Note: fumadocs-mdx's createMDXSource returns files as a getter function, 
// but fumadocs-core expects files as an array, so we use resolveFiles directly
export const source = loader({
  baseUrl: '/docs',
  source: {
    files: resolveFiles({ docs: docs.docs, meta: docs.meta }),
  },
});
