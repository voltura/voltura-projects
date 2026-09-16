import {readFile,writeFile} from 'node:fs/promises';
import {listRepositories,enrich,baseRecord,extract,rawUrl} from '../lib/catalog.mjs';
const seed=JSON.parse(await readFile('data/catalog.json','utf8'));
const repos=await listRepositories();
for(const p of seed.projects){
  const repo=repos.find(r=>r.id===p.id);if(!repo)continue;
  p.title=baseRecord(repo).title;
  if(['QuickFolders','WeekNumberLite2Plus'].includes(p.name))Object.assign(p,await enrich(repo));
  if(!p.images.length){
    const url=rawUrl(repo,'README.md'),r=await fetch(url);
    if(r.ok){const text=await r.text();const candidates=extract(text,url).images;
      for(const img of candidates){if(!/github\.com\/user-attachments\/|user-images\.githubusercontent\.com/.test(img.url))continue;
        const response=await fetch(img.url);if(response.ok&&/image\//.test(response.headers.get('content-type')||''))p.images.push(img);await response.body?.cancel();if(p.images.length===3)break;
      }
    }
  }
}
seed.refreshedAt=new Date().toISOString();
await writeFile('data/catalog.json',JSON.stringify(seed,null,2));
console.log(JSON.stringify({projects:seed.projects.length,illustrated:seed.projects.filter(p=>p.images.length).length,links:seed.projects.flatMap(p=>p.links).length,pinterest:seed.projects.flatMap(p=>p.links).filter(l=>l.kind==='Pinterest').length}));
