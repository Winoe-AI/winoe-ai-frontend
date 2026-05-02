import { proxy } from './platform/middleware/proxy';

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|site.webmanifest|sitemap.xml|robots.txt).*)',
  ],
};
