import seed from '@/data/catalog.json';
import {withCatalogPresentation} from './project-artwork.mjs';
type Catalog = typeof seed & {refreshing?: boolean; status?: string};

// Both hosts share the durable catalog and visit-triggered refresh queue.
const catalogUrl = 'https://voltura-projects.volturaab.chatgpt.site/api/catalog';
export async function getCatalog() {
  try {
    const response = await fetch(catalogUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
    const data = await response.json() as Catalog;
    if (!data || !Array.isArray(data.projects) || !Number.isFinite(Date.parse(data.refreshedAt))) {
      throw new Error('Invalid catalog response');
    }
    return withCatalogPresentation(data);
  } catch {
    return withCatalogPresentation({...seed, refreshing: false, status: 'unavailable'});
  }
}
