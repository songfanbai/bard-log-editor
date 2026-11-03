const C=require('../app/core.js'),A=require('node:assert/strict');
const tags=[['说话','Say','dialogue'],['情感动作','Emote','action'],['小队','Party','party'],['喊话','Yell','yell'],['呼喊','Shout','shout']];let count=0;
for(const [zh,en,type]of tags)for(const tag of [zh,en,en.toUpperCase(),en.toLowerCase()])for(const header of ['','[3:13]','[03:13]','[2026-09-16 3:13]','[2026-09-16 03:13]','[2026-09-16 19:59]'])for(const gap of ['',' ','   '])for(const server of ['','静语庄园'])for(const colon of [':','：']){
 const who='云舟'+server,body=type==='action'?'看向星灯：点头。':'星灯: 这里提到[小队]与服务器红玉海。';
 const tail=type==='action'?who+body:(type==='party'?'':'')+who+colon+' '+body;
 const raw=header+gap+'['+tag+']'+tail;const s=C.fresh();C.parse(s,raw+'\n[Say]'+who+': 后文建立身份\n[Say]星灯红玉海: 好');const r=s.records[0];
 A.equal(r.type,type,raw);A.equal(r.originalName,'云舟');A.equal(r.server,server);A.equal(r.body,body);A.equal(r.raw,raw);A.equal(r.job,type==='party'?'':'');A.equal(r.roleId,s.records[1].roleId);A.equal(s.roles.length,2);A.equal(r.time,header?header.slice(1,-1).split(' ').at(-1):'');A.equal(r.date,header.includes('2026')?'2026-09-16':'');
 const e=C.fresh();C.parse(e,header+gap+'['+en+']'+tail+'\n[Say]'+who+': 后文建立身份\n[Say]星灯红玉海: 好');A.deepEqual(C.view(s,r),C.view(e,e.records[0]));A.equal(C.documentXml(s),C.documentXml(e));
 A.equal(C.openProject(C.clone(s)).records[0].raw,raw);s.corrections[r.key]={...r,body:'手动正文',bodyEdited:true};s.deleted={[s.records[1].key]:true};C.parse(s,s.source);A.equal(s.records[0].body,'手动正文');A.equal(s.deleted[s.records[1].key],true);count++;
}
for(const raw of ['[24:00][说话]云舟: 好','[2026-02-30 3:13][说话]云舟: 好','[2026-09-16 3:60][小队]云舟: 好','[未知]云舟: 好','[toString]云舟: 好']){const s=C.fresh();C.parse(s,raw);A.equal(s.records[0].type,'pending');A.equal(s.records[0].raw,raw);}
for(const raw of ['[小队]新名字: 好','[情感动作]未建立身份点头。']){const s=C.fresh();C.parse(s,raw);A.equal(s.records[0].type,'pending');}
console.log('PASS',count,'Chinese/English tagged combinations, same output/XML, identity/job preservation, project/manual/deletion restore, invalid and ambiguous records');
