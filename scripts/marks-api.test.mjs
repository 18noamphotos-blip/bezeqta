import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync('pages/marks-api.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const adapter=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const snapshot=(version=1)=>({version,marks:[{matchId:1,played:false,score:''}]});
test('poll reads authoritative server only; never uploads old local cache',async()=>{
 const old=globalThis.fetch;let calls=[];
 globalThis.localStorage={getItem(){throw new Error('Must not read stale cache');}};
 globalThis.fetch=async(url,options)=>{calls.push(options);return Response.json(snapshot());};
 try {const rows=await adapter.listMarks();assert.equal(rows.version,1);assert.equal(rows[0].score,'');assert.equal(calls.length,1);assert.equal(calls[0].body,undefined);}finally{globalThis.fetch=old;delete globalThis.localStorage;}
});
test('rapid writes serialized; failure does not poison next save; poll errors propagate',async()=>{
 const old=globalThis.fetch;let active=0,max=0,seen=[];
 globalThis.fetch=async(url,o)=>{active++;max=Math.max(max,active);seen.push(JSON.parse(o.body).score);await new Promise(r=>setTimeout(r,5));active--;return Response.json(snapshot(seen.length));};
 try {await Promise.all(['1-0','2-0'].map(score=>adapter.saveMark({data:{matchId:1,played:true,score}})));assert.equal(max,1);assert.deepEqual(seen,['1-0','2-0']);
 globalThis.fetch=async()=>new Response('offline',{status:503});await assert.rejects(adapter.listMarks());await assert.rejects(adapter.saveMark({data:{matchId:1,played:false,score:''}}));
 globalThis.fetch=async()=>Response.json(snapshot(9));assert.equal((await adapter.saveMark({data:{matchId:1,played:false,score:''}})).version,9);
 }finally{globalThis.fetch=old;}
});
const mergeSource=ts.transpileModule(readFileSync('src/lib/shared-marks.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {mergeSharedSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(mergeSource).toString('base64'));
test('late snapshots rejected; polls cannot overwrite pending edits; acknowledged remote updates merge',()=>{
 const rows=Object.assign([{matchId:1,played:false,score:''},{matchId:2,played:true,score:'3-1'}],{version:5});
 const local={1:{played:true,score:'2-0'}};
 assert.equal(mergeSharedSnapshot(rows,6,local,[]),undefined);
 assert.deepEqual(mergeSharedSnapshot(rows,4,local,[1]),{version:5,entries:{1:local[1],2:{played:true,score:'3-1'}}});
 assert.deepEqual(mergeSharedSnapshot(rows,5,local,[]),{version:5,entries:{2:{played:true,score:'3-1'}}});
});
const scoreSource=ts.transpileModule(readFileSync('src/lib/score-selection.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const scores=await import('data:text/javascript;base64,'+Buffer.from(scoreSource).toString('base64'));
test('only four score choices or blank; outcome derived consistently; clearing unplays',()=>{
 assert.deepEqual(scores.ALLOWED_SCORES,['2-1','3-0','0-3','1-2']);
 for(const value of scores.ALLOWED_SCORES) assert.deepEqual(scores.scoreSelection(value),{score:value,played:true});
 assert.deepEqual(scores.scoreSelection(''),{score:'',played:false});
 for(const value of ['1-1','2-0','3-1','abc']) assert.equal(scores.scoreSelection(value),undefined);
 assert.equal(scores.outcomeFromScore('2-1'),'win');assert.equal(scores.outcomeFromScore('3-0'),'win');
 assert.equal(scores.outcomeFromScore('0-3'),'loss');assert.equal(scores.outcomeFromScore('1-2'),'loss');
 assert.equal(scores.scoreForOutcome('win',''),'2-1');assert.equal(scores.scoreForOutcome('loss',''),'0-3');
 assert.equal(scores.scoreForOutcome('win','3-0'),'3-0');assert.equal(scores.scoreForOutcome('loss','1-2'),'1-2');
 assert.equal(scores.scoreForOutcome('loss','3-0'),'0-3');assert.equal(scores.scoreForOutcome('win','1-2'),'2-1');
 assert.equal(scores.scoreForOutcome('','2-1'),'');
});
test('UI removes misleading placeholder, uses score selection and clears score on uncheck',()=>{
 const ui=readFileSync('src/routes/index.tsx','utf8');
 assert.ok(!ui.includes('placeholder="2-1"'));
 assert.ok(ui.includes('ALLOWED_SCORES.map'));
 assert.ok(ui.includes('scoreForOutcome(event.target.value as Outcome, score)'));
 assert.ok(ui.includes('{ played: false, score: "" }'));
 assert.ok(ui.includes('תוצאה קודמת:'));
});
test('allowed selections and clearing use existing shared transport, not a separate outcome field',async()=>{
 const old=globalThis.fetch;const payloads=[];
 globalThis.fetch=async(url,o)=>{payloads.push(JSON.parse(o.body));return Response.json(snapshot(payloads.length));};
 try {
  for(const score of ['2-1','3-0','0-3','1-2','']) {
   await adapter.saveMark({data:{matchId:1,...scores.scoreSelection(score)}});
  }
  assert.deepEqual(payloads.map(p=>p.score),['2-1','3-0','0-3','1-2','']);
  assert.deepEqual(payloads.at(-1),{matchId:1,score:'',played:false});
  assert.ok(payloads.every(p=>!('outcome' in p)));
 }finally{globalThis.fetch=old;}
});
