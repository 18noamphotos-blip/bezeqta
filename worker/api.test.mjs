import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import api from './index.mjs';
import { ORIGIN } from './validate.mjs';
const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
function binding(db) {
 return { prepare(sql) { return { sql, params: [], bind(...params) { return {sql, params}; } }; }, async batch(statements) {
  db.exec('BEGIN');
  try { const out=statements.map(({sql,params}) => {const stmt=db.prepare(sql); return {results:sql.startsWith('SELECT') ? stmt.all(...params) : (stmt.run(...params), [])};});db.exec('COMMIT');return out; }
  catch(e) {db.exec('ROLLBACK');throw e;}
 } };
}
function request(method='GET', data, origin=ORIGIN, path='/marks') {
 return new Request('https://test'+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
}
test('clean schema, writes, revisions, independent reads, restart durability, idempotent schema', async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bezeqta-sqlite-'));const file=join(dir,'db.sqlite');
 let db=new DatabaseSync(file);db.exec(schema);let env={DB:binding(db)};
 let result=await (await api.fetch(request(),env)).json();assert.equal(result.marks.length,12);assert.equal(result.version,0);assert.ok(result.marks.every(x=>!x.played&&x.score===''));
 const edit={matchId:1,played:true,score:'2-1'};
 result=await (await api.fetch(request('POST',edit),env)).json();assert.equal(result.version,1);assert.deepEqual(result.marks[0],edit);
 await Promise.all([api.fetch(request('POST',{matchId:2,played:true,score:'3-0'}),env),api.fetch(request('POST',{matchId:3,played:true,score:'1-1'}),env)]);
 result=await(await api.fetch(request(),env)).json();assert.equal(result.version,3);assert.equal(result.marks.filter(x=>x.played).length,3);
 db.close();db=new DatabaseSync(file);db.exec(schema);env={DB:binding(db)};
 result=await(await api.fetch(request(),env)).json();assert.equal(result.version,3);assert.equal(result.marks[0].score,'2-1');db.close();rmSync(dir,{recursive:true});
});
test('invalid IDs/types/scores, methods, paths, CORS, oversized body never touch DB',async()=>{
 const env={DB:{batch(){throw new Error('Unexpected DB access');}}};
 for(const data of [{matchId:99,played:true,score:''},{matchId:1,played:1,score:''},{matchId:1,played:true,score:'<script>'},{matchId:1,played:true,score:'123456789'}]) assert.equal((await api.fetch(request('POST',data),env)).status,400);
 assert.equal((await api.fetch(request('DELETE'),env)).status,405);
 assert.equal((await api.fetch(request('GET',undefined,ORIGIN,'/bad'),env)).status,404);
 assert.equal((await api.fetch(request('GET',undefined,'https://evil.example'),env)).status,403);
 const preflight=await api.fetch(request('OPTIONS'),env);assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 assert.equal((await api.fetch(request('POST','x'.repeat(2000)),env)).status,413);
 const bad=new Request('https://test/marks',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal((await api.fetch(bad,env)).status,400);
});
test('database outage returns retryable 503, not successful empty board', async()=>{
 assert.equal((await api.fetch(request(),{DB:{batch(){throw new Error('offline');},prepare(){return {};}}})).status,503);
});
