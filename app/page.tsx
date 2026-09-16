import Gallery from './gallery';
import {getCatalog} from '@/lib/server-catalog';
export const dynamic='force-dynamic';
export default async function Page(){return <Gallery initial={await getCatalog()}/>;}
