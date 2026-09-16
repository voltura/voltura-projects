export const OWNER = 'voltura';
export const headers = {'User-Agent':'Voltura-Projects',Accept:'application/vnd.github+json'};
async function boundedText(response,maxBytes){
  const reader=response.body?.getReader();if(!reader)return '';
  const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('Source exceeds size limit');chunks.push(value);}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder().decode(bytes);
}
export async function getJson(url,signal) {
  const r=await fetch(url,{headers,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
  if(!r.ok) { const e=new Error(`GitHub ${r.status}`); e.retryAt=Number(r.headers.get('x-ratelimit-reset')||0)*1000; throw e; }
  return JSON.parse(await boundedText(r,8*1024*1024));
}
export async function listRepositories(fetchJson=getJson) {
  const all=[];
  for(let page=1;page<=100;page++) {
    const items=await fetchJson(`https://api.github.com/users/${OWNER}/repos?type=owner&per_page=100&page=${page}`);
    if(!Array.isArray(items)) throw new Error('Invalid GitHub listing');
    all.push(...items.filter(r=>r.owner?.login?.toLowerCase()===OWNER&&!r.fork&&!r.private));
    if(items.length<100) return all;
  }
  throw new Error('Incomplete repository listing');
}
export function safeUrl(value,base) {
  try { const u=new URL(value.replace(/&amp;/g,'&'),base); return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null; } catch {return null;}
}
export function rawUrl(repo,path) {return `https://raw.githubusercontent.com/${OWNER}/${repo.name}/${repo.default_branch}/${path}`;}
export function extract(text,base) {
  const images=[],links=[];
  for(const m of text.matchAll(/!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g)) images.push({alt:m[1],url:safeUrl(m[2],base)});
  for(const m of text.matchAll(/<img\b[^>]*>/gi)) {
    const src=m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if(src) images.push({alt:m[0].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1]||'',url:safeUrl(src,base)});
  }
  for(const m of text.matchAll(/(?<!!)\[([^\]]+)\]\(\s*<?([^\s)>]+)>?(?:\s+[^)]*)?\)|<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis)) {
    const url=safeUrl(m[2]||m[3],base);if(url)links.push({label:(m[1]||m[4]||'').replace(/<[^>]+>/g,'').trim(),url});
  }
  for(const m of text.matchAll(/https?:\/\/[^\s<>"')\]]+/g)) {
    const url=safeUrl(m[0].replace(/[.,;]+$/,'')); if(url)links.push({label:'',url});
  }
  return {images:images.filter(i=>i.url&&!/shields\.io|badge|tracking|pixel|visitor|ko-fi|donate|github\/stars|github\/downloads/i.test(i.url+' '+i.alt)),links};
}
export function classifyLink(link,homepage) {
  const u=new URL(link.url),host=u.hostname.replace(/^www\./,'');
  if(host==='youtu.be'||host==='youtube.com'||host==='m.youtube.com') return 'YouTube';
  if(/(^|\.)pinterest\.[a-z.]+$/.test(host)||host==='pin.it')return 'Pinterest';
  if(homepage&&link.url.replace(/\/$/,'')===homepage.replace(/\/$/,''))return 'Product';
  return null;
}
export function baseRecord(repo) {
  const titles={'voltura-air':'Voltura Air','voltura-earner':'Voltura Earner','voltura-weeknumber':'Voltura WeekNumber','voltura-ai-watcher':'Voltura AI Watcher','voltura-download-watcher':'Voltura Download Watcher','fortnox-submitter':'Fortnox Submitter'};
  return {id:repo.id,name:repo.name,title:titles[repo.name]||repo.name.replace(/[-_]/g,' '),description:repo.description||'',url:repo.html_url,homepage:repo.homepage||null,language:repo.language||null,topics:repo.topics||[],stars:repo.stargazers_count||0,updated:repo.pushed_at||repo.updated_at,created:repo.created_at,archived:!!repo.archived,revision:repo.pushed_at,images:[],links:[]};
}
async function readText(url,signal) {
  const r=await fetch(url,{headers,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(9000)]):AbortSignal.timeout(9000)});
  if(r.status===404)return '';
  if(!r.ok)throw new Error(`Source ${r.status}`);
  return boundedText(r,300000);
}
export async function enrich(repo,old) {
  const signal=AbortSignal.timeout(24000);
  const record=baseRecord(repo);
  const tree=await getJson(`https://api.github.com/repos/${OWNER}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`,signal);
  if(tree.truncated)throw new Error('Repository tree is incomplete');
  const paths=(tree.tree||[]).filter(x=>x.type==='blob').map(x=>x.path);
  const readme=paths.find(p=>/^readme\.(md|markdown|rst|txt)$/i.test(p));
  const website=paths.filter(p=>/^(docs\/|apps\/public-site\/|website\/|public\/)?index\.(html|md)$/i.test(p));
  const sources=[...new Set([readme,...website].filter(Boolean))].slice(0,4);
  let images=[],links=[];
  for(let index=0;index<sources.length&&index<7;index++) {
    const path=sources[index],url=rawUrl(repo,path),text=await readText(url,signal),found=extract(text,url);
    images.push(...found.images);links.push(...found.links);
    if(index===0) for(const l of found.links) {
      const prefix=rawUrl(repo,'');
      if(l.url.startsWith(prefix)&&/\.(md|html)(?:#.*)?$/i.test(l.url)) {
        const p=decodeURIComponent(l.url.slice(prefix.length).split('#')[0]);
        if(paths.includes(p)&&!sources.includes(p)&&!/contributing|security|privacy|license|changelog/i.test(p)&&sources.length<7)sources.push(p);
      }
    }
  }
  const home=safeUrl(repo.homepage||'');
  if(home)links.unshift({label:'Product',url:home});
  // Only promote explicitly project-owned product destinations; do not turn dependencies into product links.
  if(!home) {
    const inferred=links.find(l=>/^https:\/\/(?:voltura\.github\.io\/|(?:www\.)?voltura\.se\/)/i.test(l.url)&&/website|product|homepage|visit|try|demo/i.test(l.label));
    if(inferred)record.homepage=inferred.url;
  }
  const seen=new Set();
  record.links=links.flatMap(l=>{const kind=classifyLink(l,home||record.homepage);const key=l.url.replace(/\/$/,'');if(!kind||seen.has(key))return [];seen.add(key);return [{kind,url:l.url,label:l.label||kind}];});
  if(!images.length)images=paths.filter(p=>/\.(png|jpe?g|webp|gif)$/i.test(p)&&/screenshot|screen-shot|banner|hero|logo|appicon/i.test(p)&&!/(node_modules|vendor|obj|bin)\//i.test(p)).slice(0,8).map(p=>({url:rawUrl(repo,p),alt:record.title}));
  const score=i=>/screenshot|screen view|host pairing|hero|banner|preview/i.test(i.url+' '+i.alt)?3:/logo|icon/i.test(i.url+' '+i.alt)?1:2;
  const unique=[...new Map(images.map(i=>[i.url,i])).values()].sort((a,b)=>score(b)-score(a));
  record.images=[];
  for(const img of unique.slice(0,6)) {
    try {const u=new URL(img.url); if(!['raw.githubusercontent.com','github.com','user-images.githubusercontent.com','private-user-images.githubusercontent.com','voltura.github.io','voltura.se','www.voltura.se'].includes(u.hostname))continue;
      const r=await fetch(img.url,{method:img.url.includes('/user-attachments/')?'GET':'HEAD',signal:AbortSignal.any([signal,AbortSignal.timeout(6000)])});
      if(r.ok&&/image\//i.test(r.headers.get('content-type')||''))record.images.push({...img,alt:img.alt||record.title});
      await r.body?.cancel();
    }catch{}
    if(record.images.length>=3)break;
  }
  signal.throwIfAborted();
  if(unique.length&&!record.images.length&&old?.images?.length)record.images=old.images;
  return record;
}
export function selectProjects(projects,query='',sort='updated') {
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return projects.filter(p=>{const text=[p.name,p.title,p.description,p.language,...p.topics].join(' ').toLowerCase();return terms.every(t=>text.includes(t));}).sort((a,b)=>{
    const alpha=a.name.localeCompare(b.name,'en',{sensitivity:'base'});
    return sort==='name'?alpha:sort==='stars'?b.stars-a.stars||alpha:Date.parse(sort==='created'?b.created:b.updated)-Date.parse(sort==='created'?a.created:a.updated)||alpha;
  });
}
