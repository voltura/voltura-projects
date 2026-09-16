import {listRepositories,enrich,baseRecord} from './catalog.mjs';
export const SIX_HOURS=6*60*60*1000;
export async function readCatalog(db,seed){
  await db.prepare('INSERT OR IGNORE INTO catalog_cache (id, payload, queue, lock_until, retry_after, error) VALUES (1, ?, NULL, 0, 0, NULL)').bind(JSON.stringify(seed)).run();
  const row=await db.prepare('SELECT * FROM catalog_cache WHERE id = 1').first();
  if(!row)throw new Error('Catalog storage unavailable');
  const data=JSON.parse(row.payload);
  return {...data,refreshing:!!row.queue,status:row.error?'delayed':'ready',due:Date.now()>=row.retry_after&&(!!row.queue||Date.now()-Date.parse(data.refreshedAt)>=SIX_HOURS)};
}
export async function refreshBatch(db,{list=listRepositories,hydrate=enrich,now=Date.now}={}){
  const token=crypto.randomUUID(),start=now();
  const lock=await db.prepare('UPDATE catalog_cache SET lock_until = ?, lock_token = ? WHERE id = 1 AND lock_until < ? AND retry_after <= ?').bind(start+60000,token,start,start).run();
  if(!lock.meta.changes)return;
  try{
    const row=await db.prepare('SELECT * FROM catalog_cache WHERE id = 1').first();
    let data=JSON.parse(row.payload),queue=row.queue?JSON.parse(row.queue):null;
    if(!queue){
      if(start-Date.parse(data.refreshedAt)<SIX_HOURS)return;
      const repos=await list();
      const previous=new Map(data.projects.map(p=>[p.id,p]));
      queue=repos.filter(r=>!previous.has(r.id)||previous.get(r.id).revision!==r.pushed_at||previous.get(r.id).homepage!==(r.homepage||null));
      // Only a complete successful listing may remove repositories.
      data.projects=repos.map(r=>{const old=previous.get(r.id);return old?{...baseRecord(r),images:old.images,links:old.links,revision:old.revision}:baseRecord(r);});
      if(!queue.length)data.refreshedAt=new Date(now()).toISOString();
      await db.prepare('UPDATE catalog_cache SET payload = ?, queue = ?, error = NULL WHERE id = 1 AND lock_token = ?').bind(JSON.stringify(data),queue.length?JSON.stringify(queue):null,token).run();
      return;
    }
    // One repository per durable batch; the visitor's next read continues the queue.
    const repo=queue[0],old=data.projects.find(p=>p.id===repo.id);
    const updated=await hydrate(repo,old);
    data.projects=data.projects.map(p=>p.id===updated.id?updated:p);
    queue.shift();
    if(!queue.length)data.refreshedAt=new Date(now()).toISOString();
    await db.prepare('UPDATE catalog_cache SET payload = ?, queue = ?, error = NULL, retry_after = 0 WHERE id = 1 AND lock_token = ?').bind(JSON.stringify(data),queue.length?JSON.stringify(queue):null,token).run();
  }catch(error){
    console.error('catalog_refresh_failed',String(error));
    await db.prepare('UPDATE catalog_cache SET error = ?, retry_after = ? WHERE id = 1 AND lock_token = ?').bind('GitHub refresh delayed',Math.max(now()+15*60*1000,error.retryAt||0),token).run();
  }finally{
    await db.prepare('UPDATE catalog_cache SET lock_until = 0, lock_token = NULL WHERE id = 1 AND lock_token = ?').bind(token).run();
  }
}
