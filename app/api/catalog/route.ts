import {getCatalog} from '@/lib/server-catalog';
export async function GET(){
  return Response.json(await getCatalog(),{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
