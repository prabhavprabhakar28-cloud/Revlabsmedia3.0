/**
 * useSEO — sets document title and meta description for each page.
 * Lightweight alternative to react-helmet-async for this project.
 */
import { useEffect } from 'react';

const SITE_NAME = 'RevLabs Media House';

export function useSEO({ title, description, canonical }) {
  useEffect(() => {
    // Title
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description || 'RevLabs Media House — Premium video production, photography, editorial design, and app development for brands and creators.';

    // OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    // OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description || '';

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = `https://revlabsmediahouse.com${canonical}`;
    }

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, canonical]);
}
