const {chromium}=require('playwright'),A=require('node:assert/strict'),path=require('path'),C=require('../app/core.js');
for(const sep of ['|','@','＠','\t'])for(const gap of ['',' ','  ']){
 A.deepEqual(C.parseRoleList('云舟'+gap+sep+gap+'静语庄园\r\nStoma'+sep+'红玉海\rJohn Smith\n星・灯｜月'),[['云舟','静语庄园'],['Stoma','红玉海'],['John Smith',''],['星・灯｜月','']]);
 A.deepEqual(C.parseRoleList('云舟'+sep),[['云舟','']]);
}
for(const bad of ['@红玉海','|','＠红玉海','\t红玉海','云舟\t\t','云舟||红玉海','云舟@＠红玉海','云舟\t\t红玉海'])A.throws(()=>C.parseRoleList('有效角色\n\n'+bad),/第 3 行/);
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});try{const p=await b.newPage({offline:true});let errors=[];p.on('dialog',async d=>{errors.push(d.message());await d.dismiss()});await p.goto(require('url').pathToFileURL(path.resolve(process.env.APP_ENTRY||'dist/吟游诗人随手记·对话log编辑器.html')).href);
async function open(text,file=false){await p.click('#knownRoles');if(file){const fc=p.waitForEvent('filechooser');await p.click('#importNames');await(await fc).setFiles({name:'中英名单.TXT',mimeType:'text/plain',buffer:Buffer.from('\uFEFF'+text)});await p.waitForFunction(()=>!taskBusy&&document.getElementById('names').value.length>0);}else await p.fill('#names',text);}
for(const file of [false,true])for(const sep of ['|','@','＠','\t'])for(const gap of ['',' ','  ']){
 await p.evaluate(()=>{state=C.fresh();setSource('');render();});await open('云舟'+gap+sep+gap+'静语庄园\r\nStoma'+gap+sep+gap+'红玉海\nJohn Smith\n星・灯｜月',file);await p.click('#addNames');A.deepEqual(await p.evaluate(()=>state.roles.map(r=>[r.name,r.server])),[['云舟','静语庄园'],['Stoma','红玉海'],['John Smith',''],['星・灯｜月','']]);
}
await p.evaluate(()=>{state=C.fresh();C.parse(state,'[Say]已有: 正文');state.roles[0].color='#123456';setSource(state.source);render();});
const before=await p.evaluate(()=>JSON.stringify({state,history,dirty}));
for(const file of [false,true])for(const bad of ['@红玉海','云舟\t\t静语庄园','云舟|红玉海@白银乡','\t红玉海','云舟\t\t']){await open('先添加的人\n\n'+bad,file);await p.click('#addNames');A(errors.at(-1).includes('第 3 行'));A.equal(await p.evaluate(()=>JSON.stringify({state,history,dirty})),before);A(await p.locator('#names').isVisible());await p.click('#closeModal');}
await open('云舟|静语庄园\nStoma@红玉海\n星灯＠白银乡\n渡川\t伊修加德\nNo Server');await p.click('#addNames');A.equal(await p.evaluate(()=>state.roles.length),6);
await open('云舟@静语庄园');await p.click('#addNames');A.equal(await p.evaluate(()=>state.roles.length),6);A(await p.evaluate(()=>C.openProject(C.clone(state)).roles.length===6));
await open('云舟');await p.keyboard.press('Tab');A.equal(await p.inputValue('#names'),'云舟');A.equal(await p.evaluate(()=>document.activeElement.id),'importNames');await p.screenshot({path:'test-results/rc8-手动添加角色.png'});
console.log('PASS rc8 24 pasted/TXT batches, four delimiters, spaces, BOM/CRLF/CR/LF, mixed names, 10 atomic failure cases with row numbers, identity reuse, restore and Tab focus');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
