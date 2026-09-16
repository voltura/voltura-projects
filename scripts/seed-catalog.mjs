import {listRepositories,enrich} from '../lib/catalog.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const repos=await listRepositories();
const projects=[];
for(let i=0;i<repos.length;i+=3) {
  const batch=await Promise.all(repos.slice(i,i+3).map(async repo=>{const record=await enrich(repo);console.log(`${record.name}: ${record.images.length} images, ${record.links.length} links`);return record;}));
  projects.push(...batch);
}
await mkdir('data',{recursive:true});
await writeFile('data/catalog.json',JSON.stringify({projects,refreshedAt:new Date().toISOString()},null,2));
console.log(`Seeded ${projects.length} original public repositories`);
