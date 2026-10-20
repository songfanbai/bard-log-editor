const C=require('../app/core.js'),A=require('node:assert/strict');
let count=0;
for(const time of ['3:13','03:13','23:59','3:13:05'])
for(const gap of ['',' ','   '])
for(const [tag,type] of [['Say','dialogue'],['Party','party'],['Emote','action'],['Shout','shout'],['Yell','yell']])
for(const server of ['','静语庄园']){
 const field='木石'+server,tail=tag==='Emote'?field+'把脑袋凑过去瞅瞅。':(tag==='Party'?'':'')+field+'：正文: 保留。';
 const raw=`[${time}]${gap}[${count%2?tag.toLowerCase():tag.toUpperCase()}]${tail}`;
 const s=C.fresh();C.parse(s,raw+'\n[Say]'+field+': 已知身份');
 const r=s.records[0];A.equal(r.type,type);A.equal(r.originalName,'木石');A.equal(r.server,server);A.equal(r.time,time);A.equal(r.date,'');A.equal(r.raw,raw);A.equal(s.roles.length,1);
 A.equal(r.body,tag==='Emote'?'把脑袋凑过去瞅瞅。':'正文: 保留。');
 A.equal(r.job,tag==='Party'?'':'');
 const shown=C.view(s,r).runs.map(x=>x.text).join('');
 A(shown.includes('['+time+']'));A(!shown.includes('Emote'));A(!shown.includes(''));
 A(C.documentXml(s).includes('['+time+']'));
 s.settings.time=false;A(!C.view(s,r).runs.map(x=>x.text).join('').includes('['+time+']'));s.settings.time=true;
 A.deepEqual(C.openProject(JSON.parse(JSON.stringify(s))).records,s.records);count++;
}
for(const time of ['24:00','3:60','3:13:60','3:1','','昨天']){
 const s=C.fresh();C.parse(s,`[${time}] [Say]木石: 保留`);A.equal(s.records[0].type,'pending');
}
const actual='[3:13] [Emote]木石把脑袋凑过去瞅瞅，奈何天色已晚只能看个大概。';
const s=C.fresh();C.parse(s,actual);A.equal(s.records[0].type,'pending');
C.ensure(s,'木石','');C.parse(s,actual);A.equal(s.records[0].type,'action');A.equal(s.records[0].body,'把脑袋凑过去瞅瞅，奈何天色已晚只能看个大概。');
C.parse(s,actual+'\n[2026-09-16 19:59] [Say]木石: 好。\n[3:14]木石 : 好。\n[Emote]木石点头。');
A.deepEqual(s.records.map(r=>r.type),['action','dialogue','dialogue','action']);
const before=s.records[0];s.corrections[before.key]={...before,body:'人工编辑的正文',bodyEdited:true};C.parse(s,s.source);A.equal(s.records[0].body,'人工编辑的正文');
A.equal(C.tagged('[Say][记录员]: 正文').rest,'[记录员]: 正文');
console.log(`PASS ${count} clock/type/spacing/server combinations, invalid clocks, actual Emote, later identities, mixed formats and project restore`);
