// Next.js 16 replaces middleware.ts with proxy.ts (Node.js runtime).
// This proxy handles locale detection/prefixing for the whole site.
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match every path except API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
