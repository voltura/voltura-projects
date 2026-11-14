import {listRepositories,enrich,baseRecord} from '../lib/catalog.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const repos=await listRepositories();
const previous=JSON.parse(await readFile('data/catalog.json','utf8'));
const byId=new Map(previous.projects.map(project=>[project.id,project]));
const projects=[];
for(let i=0;i<repos.length;i+=3) {
  const batch=await Promise.all(repos.slice(i,i+3).map(async repo=>{
    const old=byId.get(repo.id);
    const record=baseRecord(repo);
    if(old?.revision===repo.pushed_at) return {...record,images:old.images,links:old.links};
    try{return await enrich(repo,old);}
    catch(error){
      console.warn(`${repo.name}: ${error.message}`);
      const homepage=record.homepage;
      return {...record,images:old?.images||[],links:homepage?[{kind:'Product',url:homepage,label:'Product'}]:old?.links||[]};
    }
  }));
  projects.push(...batch);
}
await mkdir('data',{recursive:true});
await writeFile('data/catalog.json',JSON.stringify({projects,refreshedAt:new Date().toISOString()},null,2));
console.log(`Seeded ${projects.length} original public repositories`);
