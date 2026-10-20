const C=require('../app/core.js'),A=require('node:assert/strict'),fs=require('node:fs');
const blocks=[...fs.readFileSync('README.md','utf8').matchAll(/```(?:csharp|less)\r?\n([\s\S]*?)```/g)].map(m=>m[1].replace(/\r/g,'').trim());
A.equal(blocks.length,3);
const types=[['dialogue','action','party'],['dialogue','party','action','shout','yell'],['dice','dice']];
for(let i=0;i<blocks.length;i++){
 const s=C.fresh();C.parse(s,blocks[i]);A.deepEqual(s.records.map(r=>r.type),types[i]);
 for(const r of s.records){A.equal(r.originalName,'云舟');A.equal(r.server,'静语庄园');A.equal(r.raw,blocks[i].split('\n')[r.index]);}
 if(i===0)A.equal(s.records[2].job,'骑');
 if(i===1){A.equal(s.records[1].job,'');A.equal(s.roles.length,1);}
 if(i===2)for(const r of s.records){A.equal(r.roll,'69');A.equal(r.maxRoll,'100');}
 A.deepEqual(C.openProject(JSON.parse(JSON.stringify(s))).records.map(r=>r.type),types[i]);
}
const s=C.fresh();C.parse(s,blocks.join('\n'));A.equal(s.records.length,10);A.equal(s.roles.length,1);A(!s.records.some(r=>r.type==='pending'));
const p=C.fresh();C.parse(p,blocks[1].split('\n')[1]);A.equal(p.records[0].type,'pending');
console.log('PASS README: 10 examples grouped/mixed, types/names/servers/jobs/dice/project restore; isolated ambiguous Party stays pending');

