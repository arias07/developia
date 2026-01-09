'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ComponentProps } from 'react';

type LocalizedLinkProps = ComponentProps<typeof Link>;

export function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const locale = useLocale();

  // Convert href to string for processing
  const hrefString = typeof href === 'string' ? href : href.pathname || '';

  // Don't modify external links or hash links
  if (hrefString.startsWith('http') || hrefString.startsWith('#')) {
    return <Link href={href} {...props} />;
  }

  // Don't modify API routes
  if (hrefString.startsWith('/api')) {
    return <Link href={href} {...props} />;
  }

  // Add locale prefix if not already present
  const localizedHref =
    hrefString.startsWith(`/${locale}/`) || hrefString === `/${locale}`
      ? href
      : typeof href === 'string'
      ? `/${locale}${href}`
      : { ...href, pathname: `/${locale}${href.pathname}` };

  return <Link href={localizedHref} {...props} />;
}
