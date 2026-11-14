const artworkOrigin = 'https://voltura-projects.volturaab.chatgpt.site/project-images/';
const projectsHomepage = 'https://projects.voltura.se/';
const previousProjectsHomepage = 'https://voltura-projects.volturaab.chatgpt.site';

const descriptions = new Map([
  ['fortnox-submitter', 'Fortnox Submitter wordmark'],
  ['monks-numbering-system', 'Monks’ Numbering System card with the example number 1203'],
  ['tilesgame', 'TilesGame with colored tiles for learning colors and spelling'],
  ['voltura-books', 'Voltura Books showing a document in its dark reader'],
  ['voltura-markdown', 'Voltura Markdown product artwork featuring its document and lightning icon'],
  ['voltura-music', 'Voltura Music’s wood-framed radio showing the P1 station and tuning controls'],
  ['voltura-ord', 'Voltura Ord showing letter tiles on a green word game board'],
  ['voltura-reels', 'Voltura Reel Player showing a mountain road and fullscreen controls'],
  ['voltura-xmas', 'Voltura Julkalender artwork with a red cottage and a lit Christmas tree'],
]);

/**
 * @template {{name: string, images: Array<{url: string, alt: string}>}} Project
 * @param {Project} project
 */
export function withProjectArtwork(project) {
  const name = project.name.toLowerCase();
  const alt = descriptions.get(name);
  if (!alt) return project;

  const url = artworkOrigin + name + '.webp';
  return {
    ...project,
    images: [{ url, alt }, ...project.images.filter(image => image.url !== url)],
  };
}

/**
 * @template {{projects: (Parameters<typeof withProjectArtwork>[0] & {homepage?: string | null, links: Array<{url: string}>})[]}} Catalog
 * @param {Catalog} catalog
 */
export function withCatalogPresentation(catalog) {
  return {
    ...catalog,
    projects: catalog.projects.map(project => {
      if (project.name !== 'voltura-projects' || project.homepage?.replace(/\/$/, '') !== previousProjectsHomepage) {
        return withProjectArtwork(project);
      }

      return {
        ...project,
        homepage: projectsHomepage,
        links: project.links.map(link => link.url.replace(/\/$/, '') === previousProjectsHomepage
          ? { ...link, url: projectsHomepage }
          : link),
      };
    }),
  };
}
