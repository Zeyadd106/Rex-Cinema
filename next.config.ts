import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // Posters live in public/uploads and are served locally.
    formats: ['image/avif', 'image/webp'],
  },
};

export default withNextIntl(nextConfig);
