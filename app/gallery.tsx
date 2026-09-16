'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {Search,ArrowUpRight,Code2 as Github,Star,ArrowDownWideNarrow,Code2,Play as Youtube,Globe,X} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Empty,EmptyHeader,EmptyTitle,EmptyDescription} from '@/components/ui/empty';
import {selectProjects} from '@/lib/catalog.mjs';
import type seed from '@/data/catalog.json';
type Project=typeof seed.projects[number];
const sorts=[['updated','Recently updated'],['name','Name A–Z'],['stars','Most stars'],['created','Newest created']];
function ProjectCard({project:p,index}:{project:Project,index:number}){
  const [imageIndex,setImageIndex]=useState(0);
  const image=p.images[imageIndex];
  const title=p.title;
  return <article className={'project-card '+(!image?'text-card':'')}>
    <div className={'project-art '+(!image?'no-art':'')}>
      {image?<img key={image.url} src={image.url} alt={image.alt} loading={index<3?'eager':'lazy'} onError={()=>setImageIndex(v=>v+1)}/>:<div className="type-art"><Code2 size={26} strokeWidth={1.3}/><span>{title}</span><small>{p.language||'Open source'}</small></div>}
      <span className="project-number">{String(index+1).padStart(2,'0')}</span>
      {p.archived&&<span className="archived">Archived</span>}
    </div>
    <div className="project-body">
      <div className="project-heading"><h2>{title}</h2><span className="stars" aria-label={`${p.stars} stars`}><Star size={14}/>{p.stars}</span></div>
      <p className="description">{p.description||'Explore the source code on GitHub.'}</p>
      <div className="project-meta"><span>{p.language||'Repository'}</span><span>Updated {new Date(p.updated).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}</span></div>
      <div className="project-links"><a href={p.url} target="_blank" rel="noopener noreferrer"><Github size={15}/>GitHub<ArrowUpRight size={13}/></a>{p.links.map((l,i)=><a key={l.url} className={l.kind==='Product'?'product-link':''} href={l.url} target="_blank" rel="noopener noreferrer" title={l.label} aria-label={`${title}: ${l.label||l.kind}`}>
        {l.kind==='YouTube'?<Youtube size={15}/>:l.kind==='Pinterest'?<span className="pinterest-icon">P</span>:<Globe size={15}/>}{l.kind}{p.links.filter(x=>x.kind===l.kind).length>1?` ${p.links.slice(0,i+1).filter(x=>x.kind===l.kind).length}`:''}<ArrowUpRight size={13}/>
      </a>)}</div>
    </div>
  </article>;
}
type Catalog=typeof seed & {refreshing?:boolean,status?:string};
export default function Gallery({initial}:{initial:Catalog}){
  const [catalog,setCatalog]=useState(initial),[query,setQuery]=useState(''),[sort,setSort]=useState('updated');
  const catalogRef=useRef(catalog);catalogRef.current=catalog;
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    async function update(){try{const r=await fetch('/api/catalog',{signal:controller.signal});if(!r.ok)throw new Error('Unavailable');const data=await r.json() as Catalog;if(!Array.isArray(data.projects))throw new Error('Invalid catalog');setCatalog(data);timer=setTimeout(update,data.refreshing?5000:300000);}catch{if(!controller.signal.aborted){setCatalog(c=>({...c,status:'delayed'}));timer=setTimeout(update,60000);}}}
    void update();return()=>{controller.abort();clearTimeout(timer);};
  },[]);
  useEffect(()=>{
    type ToolRegistry={registerTool:(tool:object,options:{signal:AbortSignal})=>void|Promise<void>};
    const context=(document as Document & {modelContext?:ToolRegistry}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    try{void Promise.resolve(context.registerTool({name:'search_projects',title:'Search Voltura projects',description:'Search and sort the visible original public repository gallery.',inputSchema:{type:'object',properties:{query:{type:'string'},sort:{type:'string',enum:['updated','name','stars','created']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input:unknown){
      if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object');
      const args=input as {query?:unknown,sort?:unknown};
      if(Object.keys(args).some(k=>!['query','sort'].includes(k))||(args.query!==undefined&&typeof args.query!=='string')||(args.sort!==undefined&&!sorts.some(s=>s[0]===args.sort)))throw new Error('Invalid search or sort');
      const q=(args.query??'') as string,s=(args.sort??'updated') as string;
      flushSync(()=>{setQuery(q);setSort(s);});
      const found=selectProjects(catalogRef.current.projects,q,s) as Project[];
      return {count:found.length,projects:found.map(p=>({name:p.name,description:p.description,github:p.url,links:p.links}))};
    }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
  const projects=useMemo(()=>selectProjects(catalog.projects,query,sort) as Project[],[catalog,query,sort]);
  const nextRefreshAt=new Date(Date.parse(catalog.refreshedAt)+6*60*60*1000).toISOString();
  return <div className="site-shell">
    <header className="site-header"><a className="brand" href="/" aria-label="Voltura Projects home"><span className="brand-mark">V<span>▪</span></span><span>voltura<span className="brand-divider">/</span><span className="brand-section">projects</span></span></a><a className="profile-link" href="https://github.com/voltura" target="_blank" rel="noopener noreferrer"><Github size={17}/><span>@voltura</span><ArrowUpRight size={15}/></a></header>
    <main id="main">
      <section className="intro"><div><p className="eyebrow">VOLTURA PROJECTS</p><h1>Small tools.<br className="mobile-break"/> <span>Real possibilities.</span></h1><p className="intro-copy">Apps, experiments, and everyday utilities by Joakim Skoglund.</p></div><div className="collection-count"><strong>{catalog.projects.length}</strong><span>public projects</span></div></section>
      <section className="catalog" aria-label="Repository gallery"><div className="toolbar"><label className="search-box"><Search size={20}/><span className="sr-only">Search projects</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, languages, or ideas…"/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={17}/></button>}</label><div className="sort-control"><ArrowDownWideNarrow size={18}/><Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sort projects"><SelectValue/></SelectTrigger><SelectContent>{sorts.map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div>
      <div className="results-line"><p role="status" aria-live="polite"><strong>{projects.length}</strong> {query?'matching projects':'projects'}<span className="results-separator">/</span>{query?`Search: “${query}”`:'Originals only. Always open.'}</p><span className="collection-label">EXPLORE THE COLLECTION</span></div>
      {projects.length?<div className="project-grid">{projects.map((p,i)=><ProjectCard key={p.id} project={p} index={i}/>)}</div>:<Empty className="empty-state"><EmptyHeader><Search size={28}/><EmptyTitle>No projects found</EmptyTitle><EmptyDescription>Try another name, language, or keyword.</EmptyDescription></EmptyHeader><button className="reset-button" onClick={()=>{setQuery('');setSort('updated');}}>Reset search</button></Empty>}
      </section>
    </main>
    <footer><div className="footer-brand">voltura<span> / Built to be useful.</span></div><p>Updated from GitHub · <time dateTime={catalog.refreshedAt}>{new Date(catalog.refreshedAt).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})} UTC</time>{catalog.status==='delayed'||catalog.status==='unavailable'?<span className="sync-note">Refresh unavailable · showing saved projects</span>:catalog.refreshing?<span className="sync-note">Checking for updates…</span>:<span className="next-refresh">Next refresh after <time dateTime={nextRefreshAt}>{new Date(nextRefreshAt).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})} UTC</time> · starts on a visit</span>}</p><a href="https://github.com/voltura" target="_blank" rel="noopener noreferrer">Explore on GitHub <ArrowUpRight size={14}/></a></footer>
  </div>;
}
