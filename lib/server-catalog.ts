import {env} from 'cloudflare:workers';
import {after} from 'next/server';
import seed from '@/data/catalog.json';
import {readCatalog,refreshBatch} from './refresh.mjs';
export async function getCatalog(){
  try{
    const db=env.DB;
    if(!db)throw new Error('Catalog database is unavailable');
    const data=await readCatalog(db,seed);
    if(data.due)after(()=>refreshBatch(db));
    return {...data,refreshing:data.refreshing||data.due};
  }catch(error){
    console.error('catalog_read_failed',String(error));
    return {...seed,refreshing:false,status:'unavailable'};
  }
}
