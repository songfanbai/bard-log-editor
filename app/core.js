(function (root) {
'use strict';
const SERVERS = '拉诺西亚、潮风亭、紫水栈桥、水晶塔、幻影群岛、神拳痕、延夏、银泪湖、神意之地、白银乡、静语庄园、太阳海岸、萌芽池、白金幻象、摩杜纳、伊修加德、红玉海、旅人栈桥、海猫茶屋、红茶川、宇宙和音、拂晓之间、柔风海湾、沃仙曦染、龙巢神殿、琥珀原、晨曦王座、梦羽宝境'.split('、');
const PALETTE = ['#285B83','#8B3D57','#38664B','#535CAD','#87503A','#80510D','#214D68','#774274','#446319','#963E35','#2F6270','#654C89','#724C35','#3A5D51','#564D42','#893D76','#31548A','#5F5920','#8C3848','#475B73'];
const clone = x => JSON.parse(JSON.stringify(x));
function defaults(){return {font:'宋体',size:12,page:'A4',top:20,bottom:20,left:20,right:20,time:true,server:false,bold:true,bodyBold:false,italic:true,neutral:'#68717C',showDialogue:true,showParty:true,showAction:true,showShout:true,showYell:true,showDice:true,diceMode:'role',diceUniform:'#495C27',shoutMode:'role',yellMode:'role',shoutUniform:'#984719',yellUniform:'#624088',shoutBold:false,yellBold:false,partyMode:'role',actionMode:'role',partyUniform:'#005B66',actionUniform:'#70336A',colorRange:'all',paragraph:{align:'left',line:1.5,before:0,after:6,indent:0}};}
function migrateSettings(input){const d=defaults(),c=clone(input||{}),notes=[],out={};for(const k of Object.keys(d))if(k!=='paragraph'&&k!=='colorRange')out[k]=c[k]??d[k];
 const styles=['dialogue','party','action','shout','yell','dice'].map(k=>c[k]).filter(Boolean),global=c.paragraph||c.global||{};out.paragraph={};
 for(const k of Object.keys(d.paragraph)){const values=styles.map(v=>v[k]).filter(v=>v!==undefined),same=values.length&&values.every(v=>v===values[0]);const globalValue=global[k]??c[k];out.paragraph[k]=same?values[0]:(globalValue??c.dialogue?.[k]??d.paragraph[k]);if(values.length&&!same)notes.push(k+' → '+out.paragraph[k]+'（'+(globalValue!==undefined?'原全局值':'说话样式或默认值')+'）');}
 const ranges=['dialogueColor','partyColor','actionColor'].map(k=>c[k]).filter(v=>v!==undefined),same=ranges.length&&ranges.every(v=>v===ranges[0]);out.colorRange=same?ranges[0]:(c.colorRange??c.global?.colorRange??c.dialogueColor??d.colorRange);if(ranges.length&&!same)notes.push('染色范围 → '+(out.colorRange==='name'?'仅角色名':'角色名及正文')+'（'+(c.colorRange!==undefined?'原全局值':'说话样式')+'）');return {settings:out,notes};}
function fresh() { return {format:'cn-rp-log',version:11,exportTitle:'',source:'',draft:'',roles:[],corrections:{},records:[],settings:defaults()}; }
const identity = (name,server) => JSON.stringify([name,server||'']);
function resolve(s,id) { const seen=new Set(); let r=s.roles.find(r=>r.id===id); while(r&&r.redirect&&!seen.has(r.id)){seen.add(r.id);r=s.roles.find(x=>x.id===r.redirect);} return r; }
function ensure(s,name,server='') { name=name.trim();server=server.trim();let r=s.roles.find(r=>r.name===name&&r.server===server);if(!r){const next=Math.max(s.nextRoleId||1,s.roles.reduce((n,r)=>Math.max(n,Number(r.id.slice(1))||0),0)+1);s.nextRoleId=next+1;r={id:'r'+next,name,server,display:name,color:PALETTE.filter(x=>![s.settings.partyUniform,s.settings.actionUniform,s.settings.shoutUniform,s.settings.yellUniform,s.settings.diceUniform].map(x=>x.toUpperCase()).includes(x.toUpperCase()))[s.roles.length%PALETTE.filter(x=>![s.settings.partyUniform,s.settings.actionUniform,s.settings.shoutUniform,s.settings.yellUniform,s.settings.diceUniform].map(x=>x.toUpperCase()).includes(x.toUpperCase())).length]};s.roles.push(r);}return resolve(s,r.id); }
function timed(raw) {
 const m=raw.match(/^\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/u);
 if(m){const [h,min,sec=0]=m[1].split(':').map(Number);if(h>23||min>59||sec>59)return {time:'',rest:raw,invalid:true};return {time:m[1],rest:m[2]};}
 const invalid=/^\s*\[/u.test(raw)||/^\s*(?:\d{1,2}:\d{2}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/u.test(raw);
 return {time:'',rest:raw.trimStart(),...(invalid?{invalid:true}:{})};
}
const SORTED_SERVERS=[...SERVERS].sort((a,b)=>b.length-a.length);
function splitSpeaker(field){field=field.trim();const server=SORTED_SERVERS.find(v=>field.endsWith(v))||'';const name=(server?field.slice(0,-server.length):field).trim();return name?{name,server}:null;}
const JOB_NAMES=Array.from('骑战暗绝白学占贤僧龙忍侍镰蛇双驯诗机舞黑召赤画青刻锻铸金革衣炼烹矿园鱼剑斧幻秘枪弓斗咒');
function validJob(job){const c=Array.from(job);return job===''||(c.length===2&&!/\s/u.test(c[0])&&c[0]!==')'&&JOB_NAMES.includes(c[1]));}
function party(raw,roles=[]){
 const time=timed(raw);if(time.invalid||tagged(raw))return null;const rest=time.rest,open=rest.startsWith('\\(')?2:rest.startsWith('(')?1:0;if(!open)return null;
 const close=rest.indexOf(')',open);if(close<0)return null;const field=rest.slice(open,close),chars=Array.from(field);
 const speaker=f=>!f.trim()||/[()]/u.test(f)?null:splitSpeaker(f);
 const full=speaker(field),job=chars.slice(0,2).join(''),matched=job!==''&&validJob(job),cut=matched?speaker(chars.slice(2).join('').trim()):null;
 const known=who=>who&&roles.some(r=>r.name===who.name&&(r.server||'')===who.server);
 let who=full,occupation='';
 if(matched){const a=known(full),b=known(cut);if(a&&!b){who=full;}else if(b&&!a){who=cut;occupation=job;}else{return null;}}
 if(!who)return null;return {time:time.time,rest,...who,type:'party',marker:occupation?Array.from(occupation)[0]:'',job:occupation,body:rest.slice(close+1)};
}
function isPartyLike(raw){return /^\\?\(/u.test(timed(raw).rest);}
function dialogue(raw){const t=timed(raw);if(t.invalid||tagged(raw)||isPartyLike(raw))return null;const pos=t.rest.search(/[:：]/u);if(pos<0)return null;const field=t.rest.slice(0,pos).trim();const who=splitSpeaker(field);return who?{...t,...who,field,type:'dialogue',body:t.rest.slice(pos+1).replace(/^\s+/u,'')}:null;}
function actionMatch(s,rest){
 let found=s.roles.filter(r=>r.server&&rest.startsWith(r.name+r.server)).map(r=>({role:r,prefix:r.name+r.server,explicit:true}));
 if(!found.length)found=s.roles.filter(r=>rest.startsWith(r.name)).map(r=>({role:r,prefix:r.name,explicit:false}));
 if(!found.length)return null;
 const length=Math.max(...found.map(x=>x.prefix.length));found=found.filter(x=>x.prefix.length===length);
 const candidates=[...new Set(found.map(x=>resolve(s,x.role.id)?.id).filter(Boolean))],hit=found[0];
 return {type:candidates.length===1&&rest.length>length?'action':'pending',roleId:candidates.length===1?candidates[0]:null,candidates,originalName:hit.role.name,server:hit.explicit?hit.role.server:'',prefix:hit.prefix,explicit:hit.explicit,body:rest.slice(length),reason:candidates.length>1?'同名或重叠前缀对应多个角色身份':rest.length===length?'角色后缺少动作正文':''};
}
function lines(source){return source.split(/\r\n|\n|\r/);}
function keyed(source){const seen=new Map();return lines(source).map((raw,index)=>{const n=(seen.get(raw)||0)+1;seen.set(raw,n);return{raw,index,key:JSON.stringify([raw,n])};});}
function conflicts(s,source) {
 const count=a=>a.reduce((m,r)=>(m[r.raw]=(m[r.raw]||0)+1,m),Object.create(null)),old=count(keyed(s.source)),next=count(keyed(source));
 const keys=new Set([...Object.keys(s.corrections||{}),...Object.keys(s.deleted||{}).filter(k=>s.deleted[k]),...Object.keys(s.referenceBindings||{}).filter(k=>(s.referenceBindings[k]?.refs||[]).some(r=>r.manual))]);
 return [...keys].filter(k=>{const [raw]=JSON.parse(k);return old[raw]!==next[raw];});
}
function parseLegacy(s,source) {
 const previousSource=s.source,previousDraft=s.draft,rows=keyed(source),speeches=new Map(),parties=new Map(),ambiguous=new Set();
 // Small-team headers are authoritative and are scanned before all colon-based candidates.
 for(const row of rows){const p=party(row.raw,s.roles);if(p){parties.set(row.key,p);ensure(s,p.name,p.server);}}
 const candidates=rows.map(row=>({row,d:dialogue(row.raw)})).filter(x=>x.d).sort((a,b)=>Number(!!b.d.server)-Number(!!a.d.server)||a.d.field.length-b.d.field.length);
 // Shorter speakers are known before a longer colon-bearing action can invent a speaker name.
 for(const {row,d}of candidates){
   const exact=s.roles.some(r=>r.name===d.name&&r.server===d.server);
   const a=actionMatch(s,d.rest);
   const overlap=a&&a.prefix.length<d.field.length&&a.originalName!==d.name;
   if(overlap&&!exact){ambiguous.add(row.key);continue;}
   ensure(s,d.name,d.server);speeches.set(row.key,d);
 }
 // Resolve occupation ambiguity only after scanning the entire log for known identities.
 for(let pass=0;pass<rows.length;pass++){const found=rows.filter(r=>!parties.has(r.key)).map(row=>({row,p:party(row.raw,s.roles)})).filter(x=>x.p);if(!found.length)break;for(const {row,p}of found){parties.set(row.key,p);ensure(s,p.name,p.server);}}
 for(const row of rows){const p=party(row.raw,s.roles);if(p)parties.set(row.key,p);else parties.delete(row.key);}
 s.records=rows.map(row=>{const t=timed(row.raw),p=parties.get(row.key),d=speeches.get(row.key);let rec={...row,time:t.time,body:row.raw,type:row.raw.trim()?'pending':'plain',roleId:null,server:'',job:'',marker:'',candidates:[],reason:'未识别角色或格式'};
 if(p||d){const parsed=p||d,role=ensure(s,parsed.name,parsed.server);Object.assign(rec,{type:parsed.type,roleId:role.id,time:parsed.time,body:parsed.body,server:parsed.server,originalName:parsed.name,job:parsed.job||'',marker:parsed.marker||'',reason:''});}
 else if(isPartyLike(row.raw)){rec.reason='小队头部不完整或职业与角色名有歧义：请添加已知角色或手动指定类型、角色和正文';}
 else if(!t.invalid&&!tagged(row.raw)){const a=actionMatch(s,t.rest);if(a){Object.assign(rec,a);if(ambiguous.has(row.key)&&!a.explicit){rec.type='pending';rec.reason='说话与动作均可能成立，请指定类型与角色分界';}}}
 if(t.invalid&&!tagged(row.raw))rec.reason='时间字段格式损坏，请手动确认';
 const fix=s.corrections[row.key];if(fix)rec={...rec,...clone(fix),confirmed:true};return rec;});
 s.source=source;s.draft=source===previousSource?previousDraft:source;return s.records;
}


function tagged(raw){
 const invalid={invalid:true,inputFormat:'tagged',reason:'日期时间或类型标签无效'};
 const direct=raw.match(/^\s*\[([A-Za-z]+)\]\s*(.*)$/u);
 if(direct){const type={say:'dialogue',emote:'action',party:'party',shout:'shout',yell:'yell'}[direct[1].toLowerCase()];return type?{date:'',time:'',tag:direct[1],type,rest:direct[2],inputFormat:'tagged'}:invalid;}
 if(!/^\s*\[\d{4}-/u.test(raw))return null;
 const m=raw.match(/^\s*\[(\d{4}-\d{2}-\d{2}) (\d{2}(?::\d{2})?)\]\s*\[([^\]]+)\]\s*(.*)$/u);if(!m)return invalid;
 const [y,mo,day]=m[1].split('-').map(Number),[h,mi=0]=m[2].split(':').map(Number),days=[31,(y%4===0&&(y%100!==0||y%400===0))?29:28,31,30,31,30,31,31,30,31,30,31];
 const type={say:'dialogue',emote:'action',party:'party',shout:'shout',yell:'yell'}[m[3].toLowerCase()];
 if(!type||y<1||mo<1||mo>12||day<1||day>days[mo-1]||h>23||mi>59)return {...invalid,date:m[1],time:m[2],tag:m[3]};
 return {date:m[1],time:m[2],tag:m[3],type,rest:m[4],inputFormat:'tagged'};
}
// Dated party headers retain full-name and one-character-prefix candidates.
function partyCandidates(t){
 if(!t||t.invalid||t.type!=='party')return [];const pos=t.rest.search(/[:：]/u);if(pos<0)return [];
 const field=t.rest.slice(0,pos).trim(),speaker=splitSpeaker(field);if(!speaker)return [];
 const chars=Array.from(speaker.name),base={...t,server:speaker.server,body:t.rest.slice(pos+1).replace(/^[ \t]+/u,''),partyField:field};
 const options=[{...base,name:speaker.name,job:'',marker:'',structural:false}];
 const name=chars.slice(1).join('').trim();if(name)options.push({...base,name,job:chars[0],marker:chars[0],structural:/^\s/u.test(chars.slice(1).join(''))});return options;
}
function chooseParty(s,t){const options=partyCandidates(t),known=s._partyKnowledge||s.roles,match=x=>known.some(r=>r.name===x.name&&(r.server||'')===x.server);if(options.length===1)return options[0];const hits=options.filter(match);if(hits.length===1)return hits[0];if(hits.length>1)return null;return options.find(x=>x.structural)||null;}
function taggedRecord(s,t){
 if(!t||t.invalid)return null;
 if(t.type==='action'){
  const split=t.rest.search(/[:：]/u),a=actionMatch(s,t.rest);
  if(split>=0){const field=t.rest.slice(0,split).trim(),who=splitSpeaker(field);if(who&&(!a||a.prefix.length>=field.length))return {...t,...who,type:'action',body:t.rest.slice(split+1).replace(/^[ \t]+/u,''),job:'',marker:''};}
if(!a||a.type!=='action')return null;
  return {...t,...a,type:'action',body:a.body.replace(/^[:：][ \t]*/u,''),job:'',marker:''};
 }
 const pos=t.rest.search(/[:：]/u);if(pos<0)return null;
 let field=t.rest.slice(0,pos).trim(),job='';
 if(t.type==='party')return chooseParty(s,t);
 const who=splitSpeaker(field);if(!who)return null;
 return {...t,...who,body:t.rest.slice(pos+1).replace(/^[ \t]+/u,''),job,marker:job};
}

function dice(raw){
 let date='',time='',rest=raw.trimStart();
 const dated=rest.match(/^\[(\d{4}-\d{2}-\d{2}) (\d{2}(?::\d{2})?)\]\s*(.*)$/u);
 if(dated){const checked=tagged('['+dated[1]+' '+dated[2]+'][Say]x: x');if(!checked||checked.invalid)return null;date=dated[1];time=dated[2];rest=dated[3];}
 else {const old=rest.match(/^\[(\d{1,2}(?::\d{2})?)\]\s*(.*)$/u);if(old){const [h,m=0]=old[1].split(':').map(Number);if(h>23||m>59)return null;time=old[1];rest=old[2];}else if(rest.startsWith('['))return null;}
 const m=rest.match(/^([^:：\[\]()（）]+?)(掷出了(\d+)点[！!](?:（最大(\d+)）|\(最大(\d+)\)))$/u);if(!m)return null;
 const who=splitSpeaker(m[1]);if(!who)return null;
 return {type:'dice',...who,date,time,body:m[2],roll:m[3],maxRoll:m[4]||m[5],job:'',marker:'',inputFormat:date?'dated':'legacy'};
}

function assignRecordIds(s,previous=s.records){
 const counts=rows=>rows.reduce((m,r)=>(m.set(r.raw,(m.get(r.raw)||0)+1),m),new Map()),before=counts(previous),after=counts(s.records),old=new Map(previous.map(r=>[r.key,r.recordId])),used=new Set();
 for(const r of s.records){let id=before.get(r.raw)===after.get(r.raw)?(old.get(r.key)||r.recordId):null;if(typeof id!=='string'||!id||used.has(id))id='rec-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));r.recordId=id;used.add(id);}
}
function parse(s,source){
 const rows=keyed(source),rolls=new Map(rows.map(r=>[r.key,dice(r.raw)])),tags=new Map(rows.map(r=>[r.key,rolls.get(r.key)?null:tagged(r.raw)]));
 for(const p of rolls.values())if(p)ensure(s,p.name,p.server);
 // Seed explicit speech identities first, then keep the complete legacy pass intact.
 for(const t of tags.values())if(t&&!t.invalid&&['dialogue','shout','yell'].includes(t.type)){const p=taggedRecord(s,t);if(p)ensure(s,p.name,p.server);}
 const prior=s.records||[];const unreliable=new Set(prior.filter(r=>r.inputFormat==='tagged'&&r.type==='party'&&!r.confirmed&&!s.corrections[r.key]).map(r=>r.roleId));
 const reliable=new Set(prior.filter(r=>r.confirmed||['dialogue','shout','yell'].includes(r.type)||r.inputFormat!=='tagged').map(r=>r.roleId));
 parseLegacy(s,source);
 for(const t of [...tags.values()].filter(t=>t&&!t.invalid&&t.type==='action').sort((a,b)=>a.rest.length-b.rest.length)){const p=taggedRecord(s,t);if(p?.name)ensure(s,p.name,p.server);}
 s._partyKnowledge=s.roles.filter(r=>r.manual||!unreliable.has(r.id)||reliable.has(r.id));
 for(const t of tags.values())if(t&&!t.invalid&&['dialogue','shout','yell'].includes(t.type)){const p=taggedRecord(s,t);if(p&&!s._partyKnowledge.some(r=>r.name===p.name&&r.server===p.server))s._partyKnowledge.push(ensure(s,p.name,p.server));}
 for(const fix of Object.values(s.corrections)){const role=resolve(s,fix.roleId);if(role&&!s._partyKnowledge.some(r=>r.id===role.id))s._partyKnowledge.push(role);}
 // Each pass sees the entire source, so later reliable headers resolve earlier actions/parties.
 for(let pass=0;pass<=rows.length;pass++){let added=false;for(const t of tags.values()){if(!t||t.invalid||t.type!=='party')continue;const p=chooseParty(s,t);if(p&&!s._partyKnowledge.some(r=>r.name===p.name&&r.server===p.server)){const role=ensure(s,p.name,p.server);s._partyKnowledge.push(role);added=true;}}if(!added)break;}
 parseLegacy(s,source);
 s.records=s.records.map(r=>{const roll=rolls.get(r.key);if(roll){const role=ensure(s,roll.name,roll.server);return {...r,...roll,originalName:roll.name,roleId:role.id,reason:'',...(s.corrections[r.key]?{...clone(s.corrections[r.key]),confirmed:true}:{})};}const t=tags.get(r.key);if(!t)return {...r,date:r.date||'',inputFormat:r.inputFormat||'legacy'};
 let rec={...r,date:t.date||'',time:t.time||'',tag:t.tag||'',inputFormat:'tagged',type:'pending',roleId:null,body:r.raw,job:'',marker:'',originalName:'',server:'',reason:t.reason||'标签记录的角色或职业分界不确定，请手动指定'};
 if(t.type==='party'&&!t.invalid)rec.partyCandidates=partyCandidates(t).map(x=>({name:x.name,server:x.server,job:x.job,body:x.body,partyField:x.partyField}));
 const p=taggedRecord(s,t);if(p){const role=p.roleId?resolve(s,p.roleId):ensure(s,p.name,p.server);Object.assign(rec,{...p,originalName:p.name||p.originalName,roleId:role.id,reason:''});delete rec.rest;}
 const fix=s.corrections[r.key];if(fix)rec={...rec,...clone(fix),confirmed:true};return rec;});
 delete s._partyKnowledge;s.parserRevision=8;assignRecordIds(s,prior);applyRoleExclusions(s);refreshReferences(s);return s.records;
}
const mentionCache=new WeakMap(),recordReferenceCache=new WeakMap();
function mentionIndex(s){const signature=JSON.stringify(s.roles.map(r=>[r.id,r.name,r.server,r.display,r.redirect,r.deletedIdentity]));let cached=mentionCache.get(s);if(cached?.signature===signature)return cached;
 const root=new Map();for(const r of s.roles){const role=resolve(s,r.id);if(!role||role.deletedIdentity)continue;for(const name of new Set([r.name,role.display].filter(Boolean))){let node=root;for(const ch of name){if(!node.has(ch))node.set(ch,new Map());node=node.get(ch);}if(!node.ids)node.ids=new Set();node.ids.add(role.id);}}
 cached={signature,root};mentionCache.set(s,cached);return cached;
}
function bodyReferences(s,r){
 if(!['dialogue','party','action','shout','yell','dice'].includes(r.type))return [];
 const {signature,root}=mentionIndex(s);s.referenceBindings??={};
 let saved=s.referenceBindings[r.key];
 if(!saved||saved.body!==r.body){saved={body:r.body,refs:!saved&&Array.isArray(r.references)?r.references:[]};s.referenceBindings[r.key]=saved;}
 const valid=x=>Number.isInteger(x.start)&&Number.isInteger(x.end)&&x.start>=0&&x.end>x.start&&x.end<=r.body.length&&(x.roleId===null||resolve(s,x.roleId));
 const original=(saved.refs||[]).filter(valid).sort((a,b)=>a.start-b.start);
 const prev=recordReferenceCache.get(r),stamp=JSON.stringify(original);if(prev?.signature===signature&&prev.body===r.body&&prev.stamp===stamp)return r.references||[];
 const extent=x=>x.serverEnd||x.end;
 function nameIds(start,end){let node=root;for(const ch of r.body.slice(start,end)){node=node.get(ch);if(!node)return [];}return [...(node.ids||[])];}
 function structured(ref,ids,locks){const result={...ref};if(ref.roleId===null)return result;delete result.server;delete result.serverStart;delete result.serverEnd;
  if(ref.roleId===null)return result;const suffix=SORTED_SERVERS.find(name=>r.body.startsWith(name,ref.end));
  const hasServer=id=>s.roles.some(alias=>resolve(s,alias.id)?.id===resolve(s,id)?.id&&alias.server===suffix&&[alias.name,alias.display,resolve(s,id)?.display].includes(r.body.slice(ref.start,ref.end)));const matches=suffix?ids.filter(hasServer):[];
  if(!ref.manual&&matches.length===1)result.roleId=matches[0];
  else if(!ref.roleId){if(ids.length!==1)return null;result.roleId=ids[0];}
  const role=resolve(s,result.roleId);
  if(suffix&&role&&hasServer(result.roleId)&&!locks.some(x=>x!==ref&&x.start<ref.end+suffix.length&&extent(x)>ref.end)){
   result.server=suffix;result.serverStart=ref.end;result.serverEnd=ref.end+suffix.length;
  }return result;
 }
 const fixed=original.map(ref=>structured(ref,nameIds(ref.start,ref.end),original)).filter(Boolean);
 const refs=[...fixed];let i=0;while(i<r.body.length){const occupied=fixed.find(x=>i>=x.start&&i<extent(x));if(occupied){i=extent(occupied);continue;}let node=root,j=i,best=null;while(j<r.body.length){const ch=String.fromCodePoint(r.body.codePointAt(j));node=node.get(ch);if(!node)break;j+=ch.length;if(node.ids)best={start:i,end:j,ids:[...node.ids]};}
 if(best){const candidate=structured({start:best.start,end:best.end,roleId:undefined},best.ids,fixed);if(candidate&&!fixed.some(x=>x.start<extent(candidate)&&extent(x)>candidate.start)){refs.push(candidate);i=extent(candidate);}else i=best.end;}else i+=String.fromCodePoint(r.body.codePointAt(i)).length;}
 refs.sort((a,b)=>a.start-b.start);saved.refs=refs;r.references=refs.filter(x=>x.roleId!==null||x.frozen);recordReferenceCache.set(r,{signature,body:r.body,stamp:JSON.stringify(refs)});return r.references;
}
// Editing uses a projection of frozen names; the imported source remains untouched.
function bodyEditModel(s,r){
 bodyReferences(s,r);const refs=clone(s.referenceBindings[r.key]?.refs||[]).sort((a,b)=>a.start-b.start);
 let body='',cursor=0,delta=0;const mapped=[];
 for(const ref of refs){body+=r.body.slice(cursor,ref.start);const text=ref.frozen?ref.display:r.body.slice(ref.start,ref.end);body+=text;const next={...ref,start:ref.start+delta,end:ref.start+delta+text.length};delta+=text.length-(ref.end-ref.start);if(ref.serverStart!==undefined)next.serverStart=ref.serverStart+delta;if(ref.serverEnd!==undefined)next.serverEnd=ref.serverEnd+delta;mapped.push(next);cursor=ref.end;}
 body+=r.body.slice(cursor);return {body,refs:mapped};
}
function rebaseBodyReferences(before,after,refs){
 if(before===after)return clone(refs);let first=0,last=0;
 while(first<before.length&&first<after.length&&before[first]===after[first])first++;
 if(first>0&&/[\uD800-\uDBFF]/.test(before[first-1]))first--;
 while(last<before.length-first&&last<after.length-first&&before[before.length-1-last]===after[after.length-1-last])last++;
 if(last&&/[\uDC00-\uDFFF]/.test(before[before.length-last]))last--;
 const end=before.length-last,delta=after.length-before.length,result=[];
 for(const ref of refs){const next={...ref};if(ref.end<=first){if(ref.serverEnd>first){delete next.server;delete next.serverStart;delete next.serverEnd;}result.push(next);}else if(ref.start>=end){for(const key of ['start','end','serverStart','serverEnd'])if(next[key]!==undefined)next[key]+=delta;result.push(next);}}
 return result;
}
function setBodyReference(s,r,start,end,roleId){
 bodyReferences(s,r);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>r.body.length||(roleId!==null&&(!resolve(s,roleId)||resolve(s,roleId).deletedIdentity)))throw Error('请选择有效的正文范围及角色');
 // Selections must not divide a Unicode surrogate pair.
 for(const n of [start,end])if(n>0&&n<r.body.length&&/[\uD800-\uDBFF]/.test(r.body[n-1])&&/[\uDC00-\uDFFF]/.test(r.body[n]))throw Error('请完整选择字符');
 const saved=s.referenceBindings[r.key];saved.refs=saved.refs.filter(x=>x.end<=start||x.start>=end);saved.refs.push({start,end,roleId,manual:true});bodyReferences(s,r);
}
function refreshReferences(s){for(const r of s.records)bodyReferences(s,r);}
function mergeRoles(s,sourceIds,targetId){
 const target=resolve(s,targetId),sources=[...new Set(sourceIds.map(id=>resolve(s,id)?.id))].filter(id=>id&&id!==target?.id);
 if(!target||!sources.length)throw Error('请选择来源及目标角色');
 if(target.deletedIdentity||sources.some(id=>resolve(s,id)?.deletedIdentity))throw Error('已删除角色不能合并');
 if(target.hidden||sources.some(id=>resolve(s,id)?.hidden))throw Error('隐藏角色已锁定，请先取消隐藏再合并');
 refreshReferences(s);const ids=new Set(sources);
 for(const id of sources)s.roles.find(r=>r.id===id).redirect=target.id;
 const remap=r=>{if(ids.has(r.roleId))r.roleId=target.id;if(r.candidates)r.candidates=[...new Set(r.candidates.map(id=>resolve(s,id)?.id||id))];for(const ref of r.references||[])if(ids.has(ref.roleId))ref.roleId=target.id;};
 for(const r of s.records)remap(r);for(const r of Object.values(s.corrections))remap(r);
 for(const binding of Object.values(s.referenceBindings||{}))for(const ref of binding.refs||[])if(ids.has(ref.roleId))ref.roleId=target.id;
 refreshReferences(s);return target;
}
// Tombstones preserve exact identities and merged aliases for future parsing only.
function applyRoleExclusions(s){
 for(const r of s.records){const role=resolve(s,r.roleId);if(role?.deletedIdentity){r.detached={id:role.id,display:role.display,hidden:!!role.hidden};r.roleId=null;}}
 for(const fix of Object.values(s.corrections||{})){const role=resolve(s,fix.roleId);if(role?.deletedIdentity){fix.detached={id:role.id,display:role.display,hidden:!!role.hidden};fix.roleId=null;}}
 for(const r of s.records){for(const ref of [...(s.referenceBindings?.[r.key]?.refs||[]),...(r.references||[])]){const role=resolve(s,ref.roleId);if(role?.deletedIdentity){ref.display=role.display;ref.frozen=true;ref.manual=true;ref.roleId=null;}}}
}
function deleteRole(s,id){
 const role=resolve(s,id);if(!role||role.deletedIdentity)throw Error('角色不存在');if(role.hidden)throw Error('请先取消隐藏');
 refreshReferences(s);role.deletedIdentity=true;applyRoleExclusions(s);refreshReferences(s);return role;
}
function activeRecords(s){return s.records.filter(r=>!s.deleted?.[r.key]);}
function visible(s,r){if(r.detached?.hidden||s.deleted?.[r.key]||(['dialogue','party','action','shout','yell','dice'].includes(r.type)&&resolve(s,r.roleId)?.hidden))return false;return !['dialogue','party','action','shout','yell','dice'].includes(r.type)||s.settings[{dialogue:'showDialogue',party:'showParty',action:'showAction',shout:'showShout',yell:'showYell',dice:'showDice'}[r.type]];}
function visibleRecords(s){return s.records.filter(r=>visible(s,r));}
function view(s,r){const cfg=s.settings,liveRole=resolve(s,r.roleId),role=liveRole&&!liveRole.deletedIdentity?liveRole:r.detached?{...r.detached,color:'#333333'}:null,type=r.type,style=cfg.paragraph;const runs=[];let part='header';
 const wholeBold=['shout','yell'].includes(type)&&cfg[type+'Bold'];
 const add=(text,color,bold=false,italic=false,neutral=false)=>{if(text)runs.push({text,color,bold:!neutral&&(bold||(part==='body'&&wholeBold)),italic,part});};
 if(type==='plain'||type==='pending'||!role){part='body';add(r.bodyEdited?r.body:r.raw,'#333333');return{runs,style:{...style,indent:0},type};}
 const italic=type==='action'&&cfg.italic,color=type!=='dialogue'&&cfg[type+'Mode']==='uniform'?cfg[type+'Uniform']:role.color,all=cfg.colorRange==='all';
 if(cfg.time&&r.time)add('['+r.time+']'+(type==='party'?'':' '),cfg.neutral,false,false,true);
 if(type==='party')add('(',all?color:'#333333');
 add(role.display,color,(!r.detached&&cfg.bold)||wholeBold,italic);runs[runs.length-1].part='name';if(!r.detached)runs[runs.length-1].roleId=role.id;
 if(type!=='party'&&cfg.server&&r.server)add('（'+r.server+'）',cfg.neutral,false,false,true);
 if(type==='party')add(')',all?color:'#333333');
 if(['dialogue','shout','yell'].includes(type))add('： ',all?color:'#333333');
 part='body';let offset=0;const uniform=type!=='dialogue'&&cfg[type+'Mode']==='uniform',refs=bodyReferences(s,r);for(const ref of refs){add(r.body.slice(offset,ref.start),all?color:'#333333',false,italic);const mentioned=resolve(s,ref.roleId);add(ref.frozen?ref.display:(mentioned?.display||r.body.slice(ref.start,ref.end)),ref.frozen?(all?color:'#333333'):(uniform?color:(mentioned?.color||color)),!ref.frozen&&cfg.bodyBold,italic);offset=ref.end;if(ref.server){if(cfg.server&&type!=='party')add(ref.server,cfg.neutral,false,italic,true);offset=ref.serverEnd;}}add(r.body.slice(offset),all?color:'#333333',false,italic);
 return {runs,style,type};
}
const xml = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

function titleView(s){return {text:typeof s.exportTitle==='string'&&s.exportTitle.trim()?s.exportTitle:'',font:s.settings.font,size:18,color:'#263C3A',bold:true,align:'center',line:1.4,after:12};}
function exportFilename(title){let name=String(title||'').trim().replace(/(?:\.docx)+$/i,'').replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g,'_').replace(/[. ]+$/g,'').trim();if(!name||/^\.+$/.test(name))name='整理后的对话日志';if(/^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(name))name='_'+name;let safe='';const enc=new TextEncoder();for(const ch of name){if((safe+ch).length>120||enc.encode(safe+ch).length>180)break;safe+=ch;}safe=safe.replace(/[. ]+$/g,'')||'整理后的对话日志';return safe+'.docx';}
function titleXml(s){const t=titleView(s);if(!t.text)return '';return '<w:p><w:pPr><w:pStyle w:val="ExportTitle"/><w:spacing w:before="0" w:after="240" w:line="336" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="'+xml(t.font)+'" w:hAnsi="'+xml(t.font)+'" w:eastAsia="'+xml(t.font)+'" w:cs="'+xml(t.font)+'"/><w:b/><w:color w:val="263C3A"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>'+t.text.split(/(\t|\n)/).map(x=>x==='\t'?'<w:tab/>':x==='\n'?'<w:br/>':'<w:t xml:space="preserve">'+xml(x)+'</w:t>').join('')+'</w:r></w:p>';}

function documentXml(s){const c=s.settings;const p=visibleRecords(s).map(r=>{const v=view(s,r),z=v.style;return '<w:p><w:pPr><w:pStyle w:val="'+(r.type==='party'?'Party':r.type==='action'?'Action':'Dialogue')+'"/><w:spacing w:before="'+Math.round(z.before*20)+'" w:after="'+Math.round(z.after*20)+'" w:line="'+Math.round(z.line*240)+'" w:lineRule="auto"/><w:ind w:firstLine="'+Math.round(z.indent*c.size*20)+'"/><w:jc w:val="'+z.align+'"/><w:rPr><w:rFonts w:ascii="'+xml(c.font)+'" w:hAnsi="'+xml(c.font)+'" w:eastAsia="'+xml(c.font)+'" w:cs="'+xml(c.font)+'"/><w:sz w:val="'+Math.round(c.size*2)+'"/></w:rPr></w:pPr>'+v.runs.map(run=>'<w:r><w:rPr><w:rFonts w:ascii="'+xml(c.font)+'" w:hAnsi="'+xml(c.font)+'" w:eastAsia="'+xml(c.font)+'" w:cs="'+xml(c.font)+'"/><w:color w:val="'+run.color.slice(1)+'"/><w:sz w:val="'+Math.round(c.size*2)+'"/><w:szCs w:val="'+Math.round(c.size*2)+'"/>'+(run.bold?'<w:b/>':'')+(run.italic?'<w:i/>':'')+'</w:rPr>'+run.text.split(/(\t|\n)/).map(t=>t==='\t'?'<w:tab/>':t==='\n'?'<w:br/>':'<w:t xml:space="preserve">'+xml(t)+'</w:t>').join('')+'</w:r>').join('')+'</w:p>';}).join('');
 const size=c.page==='A4'?[210,297]:[215.9,279.4],tw=n=>Math.round(n*1440/25.4);
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+titleXml(s)+p+'<w:sectPr><w:pgSz w:w="'+tw(size[0])+'" w:h="'+tw(size[1])+'"/><w:pgMar w:top="'+tw(c.top)+'" w:right="'+tw(c.right)+'" w:bottom="'+tw(c.bottom)+'" w:left="'+tw(c.left)+'" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
const CRC_TABLE=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function zip(entries){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const u16=(v,o,n)=>v.setUint16(o,n,true),u32=(v,o,n)=>v.setUint32(o,n,true);for(const [name,value]of Object.entries(entries)){const n=enc.encode(name),data=enc.encode(value);let crc=0xffffffff;for(const b of data)crc=CRC_TABLE[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;const h=new Uint8Array(30+n.length),v=new DataView(h.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,12,33);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,n.length);h.set(n,30);parts.push(h,data);const ch=new Uint8Array(46+n.length),cv=new DataView(ch.buffer);u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x800);u16(cv,14,33);u32(cv,16,crc);u32(cv,20,data.length);u32(cv,24,data.length);u16(cv,28,n.length);u32(cv,42,offset);ch.set(n,46);central.push(ch);offset+=h.length+data.length;}
 const end=new Uint8Array(22),v=new DataView(end.buffer),length=central.reduce((n,x)=>n+x.length,0);u32(v,0,0x06054b50);u16(v,8,central.length);u16(v,10,central.length);u32(v,12,length);u32(v,16,offset);const result=new Uint8Array(offset+length+22);let i=0;for(const a of [...parts,...central,end]){result.set(a,i);i+=a.length;}return result;}
function stylesXml(s){const c=s.settings,fonts='<w:rFonts w:ascii="'+xml(c.font)+'" w:hAnsi="'+xml(c.font)+'" w:eastAsia="'+xml(c.font)+'" w:cs="'+xml(c.font)+'"/>',rpr='<w:rPr>'+fonts+'<w:sz w:val="'+Math.round(c.size*2)+'"/><w:szCs w:val="'+Math.round(c.size*2)+'"/></w:rPr>';return '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault>'+rpr+'</w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>'+rpr+'</w:style>'+[['Dialogue','说话'],['Action','动作'],['Party','小队'],['ExportTitle','导出标题']].map(([id,name])=>'<w:style w:type="paragraph" w:styleId="'+id+'"><w:name w:val="'+name+'"/><w:basedOn w:val="Normal"/></w:style>').join('')+'</w:styles>';}
function docx(s){return zip({'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>', '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>','word/document.xml':documentXml(s),'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>','word/styles.xml':stylesXml(s)});}
function validateSettings(input){if(!input||typeof input!=='object')throw Error('缺少排版配置');const c=migrateSettings(input).settings;
 for(const k of ['size','top','bottom','left','right'])if(!Number.isFinite(c[k])||c[k]<0||c[k]>(k==='size'?72:70))throw Error('无效排版数值：'+k);
 if(c.size<6||typeof c.font!=='string'||!c.font.trim()||c.font.length>100)throw Error('字体或字号无效');if(!['A4','Letter'].includes(c.page))throw Error('页面大小无效');
 for(const k of ['time','server','bold','bodyBold','italic','showDialogue','showParty','showAction','showShout','showYell','showDice','shoutBold','yellBold'])if(typeof c[k]!=='boolean')throw Error('显示设置无效');
 for(const k of ['neutral','partyUniform','actionUniform','shoutUniform','yellUniform','diceUniform'])if(!/^#[\da-f]{6}$/i.test(c[k]))throw Error('颜色无效');for(const k of ['partyMode','actionMode','shoutMode','yellMode','diceMode'])if(!['role','uniform'].includes(c[k]))throw Error('染色模式无效');if(!['all','name'].includes(c.colorRange))throw Error('染色范围无效');
 const z=c.paragraph;if(!['left','center','right','both'].includes(z.align))throw Error('对齐方式无效');for(const n of ['before','after','indent','line'])if(!Number.isFinite(z[n])||z[n]<0||z[n]>(n==='line'?5:n==='indent'?10:100))throw Error('段落设置无效');if(z.line<1)throw Error('行距不能小于1');return c;}
function normalizeType(type){return ({'发言':'dialogue','说话':'dialogue','speech':'dialogue','say':'dialogue','小队':'party','动作':'action','呼喊':'shout','喊话':'yell','掷骰':'dice'})[type]||type;}
function openProject(data){
 if(data.format!=='cn-rp-log'||![1,2,3,4,5,6,7,8,9,10,11].includes(data.version))throw Error('不是受支持的项目文件（支持版本 1–11）');
 if(typeof data.source!=='string'||(data.draft!==undefined&&typeof data.draft!=='string')||!Array.isArray(data.roles)||!data.corrections||typeof data.corrections!=='object')throw Error('项目结构不完整');
 const s=clone(data);s.version=11;s.exportTitle=s.exportTitle??'';if(typeof s.exportTitle!=='string')throw Error('导出标题必须为文本');s.draft=s.draft??s.source;s.migrationNotes=migrateSettings(s.settings).notes;s.settings=validateSettings(s.settings);const ids=new Set();
 for(const r of s.roles){r.server=r.server??'';r.hidden=r.hidden===true;if(typeof r.id!=='string'||!/^r[1-9]\d*$/.test(r.id)||ids.has(r.id)||!r.name||typeof r.name!=='string'||typeof r.display!=='string'||!r.display.trim()||typeof r.server!=='string'||!/^#[\da-f]{6}$/i.test(r.color))throw Error('角色数据无效');ids.add(r.id);}
 for(const r of s.roles){let x=r;const seen=new Set();while(x.redirect){if(seen.has(x.id))throw Error('角色合并关系循环');seen.add(x.id);x=s.roles.find(a=>a.id===x.redirect);if(!x)throw Error('角色合并目标缺失');}}
 const rows=keyed(s.source),keys=new Set(rows.map(r=>r.key));
 function validateRecord(v,correction=false){v.type=normalizeType(v.type);v.server=v.server??'';v.job=v.job??'';if(data.version<4&&v.type==='party'&&v.job&&Array.from(v.job).length===1)v.job=''+v.job;v.date=v.date??'';v.inputFormat=v.inputFormat??'legacy';if(typeof v.date!=='string')throw Error('日期字段无效');v.marker=v.type==='party'&&v.job?(v.inputFormat==='tagged'?v.job:Array.from(v.job)[0]):'';if(!['action','dialogue','party','shout','yell','dice','plain','pending'].includes(v.type)||typeof v.body!=='string'||typeof v.time!=='string'||typeof v.server!=='string'||typeof v.job!=='string'||typeof v.marker!=='string'||(['action','dialogue','party','shout','yell','dice'].includes(v.type)&&!ids.has(v.roleId)&&!(v.roleId===null&&v.detached&&typeof v.detached.display==='string'&&typeof v.detached.id==='string'&&s.roles.some(r=>r.id===v.detached.id&&r.deletedIdentity))))throw Error('记录或手动修正数据无效');return v;}
 for(const [k,v]of Object.entries(s.corrections)){if(!keys.has(k))throw Error('手动修正不对应原文');validateRecord(v,true);}
 // Restore saved parsing as well as corrections: opening never silently reinterprets a legacy log.
 if(Array.isArray(s.records)&&s.records.length===rows.length){s.records=s.records.map((r,i)=>{if(r.raw!==rows[i].raw)throw Error('解析记录与原文不一致');return {...validateRecord(r),...rows[i],...(s.corrections[rows[i].key]?{...s.corrections[rows[i].key],confirmed:true}:{})};});}
 else{const draft=s.draft;parse(s,s.source);s.draft=draft;}
 // Re-evaluate only unconfirmed dated records from pre-revision projects.
 if(s.parserRevision!==8&&s.records.some(r=>(tagged(r.raw)||dice(r.raw))&&!r.confirmed)){
  const freshState=clone(s);parse(freshState,s.source);let changed=0;
  s.records=s.records.map((r,i)=>{if((!tagged(r.raw)&&!dice(r.raw))||r.confirmed||s.corrections[r.key])return r;const next=freshState.records[i];if(['type','originalName','server','job','body','time','date'].some(k=>r[k]!==next[k]))changed++;return next;});
  s.roles=freshState.roles;s.nextRoleId=freshState.nextRoleId;if(changed)s.migrationNotes.push('已按当前规则重新识别 '+changed+' 条未确认的日期标签或掷骰记录；手动修正保持不变。');
 }
 s.parserRevision=8;assignRecordIds(s);applyRoleExclusions(s);refreshReferences(s);return s;
}

function colorLab(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);const [r,g,b]=rgb,y=.2126*r+.7152*g+.0722*b;const f=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;const x=f((.4124*r+.3576*g+.1805*b)/.95047),yy=f(y),z=f((.0193*r+.1192*g+.9505*b)/1.08883);return {lab:[116*yy-16,500*(x-yy),200*(yy-z)],contrast:1.05/(y+.05)};}
function autoPalette(s){const roles=s.roles.filter(r=>!r.redirect&&!r.hidden&&!r.deletedIdentity),reserved=new Set([s.settings.partyUniform,s.settings.actionUniform,s.settings.shoutUniform,s.settings.yellUniform,s.settings.diceUniform,...s.roles.filter(r=>!r.redirect&&r.hidden).map(r=>r.color)].map(x=>x.toUpperCase())),colors=PALETTE.filter(x=>!reserved.has(x.toUpperCase()));
 if(roles.length>colors.length){const used=new Set([...reserved,...colors.map(x=>x.toUpperCase())]),anchors=[...used].map(x=>colorLab(x).lab),candidates=[];const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(let r=24;r<=200;r+=16)for(let g=24;g<=200;g+=16)for(let b=24;b<=200;b+=16){if(Math.max(r,g,b)-Math.min(r,g,b)<32)continue;const hex='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();if(used.has(hex))continue;const sample=colorLab(hex);if(sample.contrast<4.5)continue;candidates.push({hex,lab:sample.lab,min:Math.min(...anchors.map(a=>distance(a,sample.lab)))});}
 while(colors.length<roles.length){let best=-1;for(let i=0;i<candidates.length;i++)if(best<0||candidates[i].min>candidates[best].min)best=i;if(best<0||candidates[best].min<8)throw Error('可辨识颜色不足，未修改角色颜色。请减少角色数量或手动配色。');const [pick]=candidates.splice(best,1);colors.push(pick.hex);for(const v of candidates)v.min=Math.min(v.min,distance(v.lab,pick.lab));}}
 for(let i=colors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]];}
 if(roles.length&&roles.every((r,i)=>r.color.toUpperCase()===colors[i].toUpperCase())&&colors.length>1)colors.push(colors.shift());return colors.slice(0,roles.length);
}
const API={bodyEditModel,rebaseBodyReferences,deleteRole,applyRoleExclusions,dice,titleView,exportFilename,mergeRoles,autoPalette,colorLab,activeRecords,setBodyReference,partyCandidates,chooseParty,tagged,taggedRecord,bodyReferences,refreshReferences,JOB_NAMES,SERVERS,PALETTE,clone,defaults,fresh,identity,resolve,ensure,timed,splitSpeaker,party,validJob,dialogue,actionMatch,visible,visibleRecords,normalizeType,keyed,conflicts,parse,view,docx,documentXml,validateSettings,migrateSettings,openProject};root.LogCore=API;if(typeof module!=='undefined')module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
