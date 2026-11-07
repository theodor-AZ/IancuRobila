import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = fileURLToPath(new URL('../demo-campaigns',import.meta.url));
const mime: Record<string,string>={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.pdf':'application/pdf','.json':'application/json'};
createServer(async(req,res)=>{
 try {
  const path=decodeURIComponent(new URL(req.url??'/', 'http://localhost').pathname);
  let target=resolve(base,'.'+path);
  if(target!==base&&!target.startsWith(base+sep)){res.writeHead(403).end();return;}
  if((await stat(target)).isDirectory())target=resolve(target,'index.html');
  const content=await readFile(target);
  res.writeHead(200,{'Content-Type':mime[extname(target)]??'application/octet-stream','Cache-Control':'no-store'}).end(content);
 }catch {res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
}).listen(Number(process.env.PORT??4173),'127.0.0.1',()=>console.log('Fixtures: http://127.0.0.1:4173/{cosmetics,detergent,store,control}/'));
