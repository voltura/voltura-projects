import type catalog from '@/data/catalog.json';

type Project = typeof catalog.projects[number];

const current = new Set([
  'voltura-air', 'voltura-worlds', 'voltura-places', 'voltura-music', 'voltura-ord',
  'voltura-books', 'voltura-markdown', 'volturatextclock', 'voltura-weeknumber',
  'voltura-earner', 'voltura-hardtop', 'voltura-neton', 'voltura-vault', 'voltura-reels',
  'voltura-imdb-poster-browser-skin',
]);

export function currentProjects(projects: Project[]): Project[] {
  const selected = projects.filter(project => !project.archived && current.has(project.name.toLowerCase()));
  if (!selected.some(project => project.name === 'voltura-music')) {
    selected.push({
      id: -1, name: 'voltura-music', title: 'Voltura Music',
      description: 'A retro web radio with live stations from around the world.',
      url: 'https://music.voltura.se/', homepage: 'https://music.voltura.se/',
      language: 'Web app', topics: ['radio', 'music'], stars: 0, archived: false,
      updated: '2026-11-09T00:00:00Z', created: '2026-10-08T00:00:00Z',
      revision: '2026-11-09T00:00:00Z', images: [], links: [],
    });
  }
  return selected;
}
