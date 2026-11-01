const C=require('../app/core.js'),A=require('node:assert/strict'),fs=require('fs');
const s=C.fresh();C.parse(s,'[10:00][Say]云舟静语庄园: 星灯红玉海来了\n[10:01][Say]星灯红玉海: 云舟静语庄园好\n[10:02][Party]★云舟静语庄园: 星灯红玉海来了\n[10:03][Emote]云舟静语庄园看向星灯红玉海\n[10:04][Shout]云舟静语庄园: 星灯来了\n[10:05][Yell]云舟静语庄园: 星灯来了\n[10:06]云舟静语庄园掷出了6点！（最大10）');const [a,b]=s.roles;a.font='楷体';b.font='Arial';s.settings.font='宋体';s.settings.server=true;
for(const r of s.records){const runs=C.view(s,r).runs;A(runs.filter(x=>x.text.startsWith('[')).every(x=>x.font==='宋体'));if(r.roleId===a.id){A.equal(runs.find(x=>x.part==='name').font,'楷体');A(runs.filter(x=>x.text==='星灯').every(x=>x.font==='Arial'));}A(runs.filter(x=>x.text==='红玉海'||x.text.startsWith('（')).every(x=>x.font==='宋体'));}
b.font='';A.equal(C.view(s,s.records[0]).runs.find(x=>x.text==='星灯').font,'宋体');s.settings.font='Georgia';A.equal(C.view(s,s.records[0]).runs.find(x=>x.text==='星灯').font,'Georgia');A.equal(C.view(s,s.records[0]).runs.find(x=>x.part==='name').font,'楷体');b.font='Arial';
A.equal(C.openProject(C.clone(s)).roles[0].font,'楷体');const old=C.clone(s);old.roles.forEach(r=>delete r.font);A(C.openProject(old).roles.every(r=>r.font===''));
const m=C.clone(s);C.mergeRoles(m,[a.id],b.id);A.equal(C.view(m,m.records[0]).runs.find(x=>x.part==='name').font,'Arial');
const d=C.clone(s);C.deleteRole(d,b.id);A.equal(C.view(d,d.records[0]).runs.find(x=>x.text==='星灯').font,'Georgia');C.deleteRole(d,a.id);A(C.view(d,d.records[0]).runs.every(x=>x.font==='Georgia'));
const xml=C.documentXml(s);for(const f of ['楷体','Arial','Georgia'])for(const field of ['ascii','hAnsi','eastAsia','cs'])A(xml.includes('w:'+field+'="'+f+'"'));
fs.writeFileSync('test-results/rc9-fonts.docx',C.docx(s));fs.writeFileSync('test-results/rc9-font-runs.json',JSON.stringify(s.records.map(r=>C.view(s,r).runs)));
console.log('PASS rc9 six types, body reference/neutral fonts, global fallback, project/old project, merge/delete, XML four font attributes');
