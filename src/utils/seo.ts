import { useEffect } from 'react';

export type AppView = 'app' | 'product' | 'pricing';

export interface SeoConfig {
  path: string;
  title: string;
  description: string;
  keywords: string;
  ogType: 'website';
}

export const SITE_NAME = 'Sendarro';

export const SEO_CONFIGS: Record<AppView, SeoConfig> = {
  app: {
    path: '/',
    title: 'Sendarro — Collection Drop Boxes & Instant File Sharing',
    description:
      'Collect files from teammates, students, or clients in one organized inbox with zero contributor logins, or share text and files up to 2GB via 8-character codes.',
    keywords:
      'collection drop box, collect files without login, sendarro, file request link, 8 character file transfer, universal clipboard, temporary file sharing',
    ogType: 'website',
  },
  product: {
    path: '/product',
    title: 'Sendarro Product — Collection Drop Boxes & Instant Beaming',
    description:
      'Discover Sendarro Collection Drop Boxes: gather homework, event media, and client files without logins, export in 1 click to ZIP or Drive, and share up to 2GB.',
    keywords:
      'collection drop box, file collection inbox, client file request, teacher assignment dropbox, bulk zip export, google drive file intake, 7 day locked vault',
    ogType: 'website',
  },
  pricing: {
    path: '/pricing',
    title: 'Sendarro Pricing — Free Collection Trial, Pro & Pro Max',
    description:
      'Start free with 1 Trial Collection Box and 10MB sharing, upgrade to Pro ($4.99/mo) for 500MB transfers, or Pro Max ($9.99/mo) for unlimited Collection Boxes.',
    keywords:
      'sendarro pricing, collection box pricing, file dropbox alternative pricing, 2gb file transfer plan, google drive batch export',
    ogType: 'website',
  },
};

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function buildJsonLd(view: AppView, origin: string) {
  const config = SEO_CONFIGS[view];
  const canonicalUrl = `${origin}${config.path}`;

  const softwareApp = {
    '@type': 'SoftwareApplication',
    name: 'Sendarro',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web, Windows, macOS, iOS, Android',
    url: canonicalUrl,
    description: config.description,
    featureList: [
      'Collection Drop Boxes with zero contributor login required',
      'Instant 8-character and QR code text and file sharing',
      '1-click batch export to ZIP, Google Drive folders, and Dropbox',
      'Auto-closing collection submission deadlines',
      '7-Day Locked Vault recovery and 15-minute link reactivation',
      'Burn-on-Read single-use transfers and Cloudflare R2 streaming up to 2GB',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Guest & Trial',
        price: '0',
        priceCurrency: 'USD',
        description:
          '10MB file limit, 10,000 character clips, and 1 Free Trial Collection Box (up to 5 submissions, 24h window).',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '4.99',
        priceCurrency: 'USD',
        description:
          '500MB file transfers via Cloudflare R2, 100,000 character clips, custom aliases, 24h clip expiry, and 1 Free Trial Collection Box.',
      },
      {
        '@type': 'Offer',
        name: 'Pro Max',
        price: '9.99',
        priceCurrency: 'USD',
        description:
          'Unlimited Collection Drop Boxes & submissions, 2GB file ceiling, auto-closing deadlines, 1-click ZIP/Google Drive/Dropbox export, and 7-Day Locked Vault.',
      },
    ],
  };

  if (view === 'product') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        softwareApp,
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How do Sendarro Collection Boxes work without contributor logins?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Create a Collection Box and share its 8-character code or QR link. Anyone can open the box, type their name, and upload files directly from desktop or mobile without creating an account.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I try a Collection Box before upgrading to Pro Max?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Every signed-in Google account gets 1 Free Trial Collection Box supporting up to 5 contributor submissions over a 24-hour window before upgrading.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do 1-click ZIP, Google Drive, and Dropbox exports organize submissions?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pro Max lets you download every submission in a single ZIP archive, stream them directly into Google Drive sorted into contributor subfolders, or save them straight to Dropbox.',
              },
            },
            {
              '@type': 'Question',
              name: 'What happens when a Collection Box or clip expires?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Standard clips purge automatically on expiration. Pro Max preserves expired boxes and clips inside your 7-Day Locked Vault so you can review submissions or reactivate links for 15 minutes.',
              },
            },
          ],
        },
      ],
    };
  }

  if (view === 'pricing') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        softwareApp,
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Do contributors uploading to my Collection Box need a paid plan or account?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Contributors never need a Sendarro account or subscription to upload files to your Collection Box.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the difference between Pro and Pro Max?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pro ($4.99/mo) unlocks 500MB file transfers, 100k character clips, custom aliases, and 24h expiry. Pro Max ($9.99/mo) adds Unlimited Collection Boxes, 2GB uploads, auto-closing deadlines, 1-click ZIP/Drive/Dropbox batch export, and the 7-Day Locked Vault.',
              },
            },
          ],
        },
      ],
    };
  }

  return {
    '@context': 'https://schema.org',
    ...softwareApp,
  };
}

export function useDocumentSeo(view: AppView) {
  useEffect(() => {
    const config = SEO_CONFIGS[view];
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${config.path}`;
    const ogImage = `${origin}/sendarro-logo.png`;

    document.title = config.title;
    upsertMetaTag('name', 'description', config.description);
    upsertMetaTag('name', 'keywords', config.keywords);
    upsertMetaTag('property', 'og:type', config.ogType);
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:title', config.title);
    upsertMetaTag('property', 'og:description', config.description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', ogImage);
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', config.title);
    upsertMetaTag('name', 'twitter:description', config.description);
    upsertMetaTag('name', 'twitter:image', ogImage);
    upsertCanonicalLink(canonicalUrl);

    let jsonLdScript = document.getElementById('sendarro-jsonld') as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'sendarro-jsonld';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(buildJsonLd(view, origin));
  }, [view]);
}
