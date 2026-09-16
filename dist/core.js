export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=()=>globalThis.crypto.randomUUID();
export const clone=x=>JSON.parse(JSON.stringify(x));
export const mmss=ms=>{const n=Math.floor(Math.abs(ms)/1000);return `${ms<0?'−':''}${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`};
export const hhmm=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')} h ${String(n%60).padStart(2,'0')}`;
export function elapsed(clock,now=Date.now()){return Math.max(0,(clock.elapsed||0)+(clock.running?now-clock.anchor:0))}
export function schedule(sections,start='14:00'){let t=start.split(':').reduce((a,v,i)=>a+Number(v)*(i?1:60),0);return sections.map(s=>{const a=t;t+=s.minutes;return {start:a,end:t}})}
export function normalized(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
export function parseCommand(text,wake='trame',requireWake=true){
 const s=normalized(text), w=normalized(wake); if(!w)return null;
 const parts=s.split(' '), words=w.split(' '); const re=new RegExp(`(?:^| )${words.join(' ')}(?: |$)`);
 if(requireWake&&!re.test(s))return null;
 const body=s.replace(new RegExp(`\\b${words.join(' ')}\\b`,'g'),'').replace(/\s+/g,' ').trim();
 const commands={next:['suivante','slide suivante','diapo suivante','passe a la suivante','passe a la slide suivante'],prev:['precedente','slide precedente','diapo precedente','reviens a la precedente'],black:['ecran noir','masque la slide'],reveal:['revele','revele la reponse','montre la reponse'],stop:['stop','silence','arrete','arrete de parler']};
 for(const [action,forms] of Object.entries(commands))if(forms.includes(body))return {action};
 return requireWake&&re.test(s)?{action:'question',text:body||'Reformule la notion de cette slide.'}:null;
}
export function safeMedia(src){return typeof src==='string'&&(/^(assets\/[a-zA-Z0-9._/-]+)$/.test(src)||/^data:(image\/(png|jpeg|webp|gif)|audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|webm)|video\/(mp4|webm|ogg));base64,[a-zA-Z0-9+/=\r\n]+$/.test(src));}
export function validateCourse(c){
 if(!c||c.schema!==1||!Array.isArray(c.sections)||!Array.isArray(c.slides)||!Array.isArray(c.missions)||!Array.isArray(c.memo))throw Error('Ce fichier n’est pas un atelier Trame valide.');
 if(!c.sections.length||c.sections.length>40||!c.slides.length||c.slides.length>200)throw Error('Atelier vide ou trop volumineux (200 slides maximum).');
 for(const k of ['title','venue','date','author'])if(typeof c[k]!=='string'||c[k].length>500)throw Error('Informations de l’atelier invalides.');if(!Array.isArray(c.checklist)||c.checklist.length>50||c.checklist.some(x=>typeof x!=='string'))throw Error('Liste de préparation invalide.');if(c.missions.length>30||c.memo.length>30)throw Error('Trop de supports.');const ids=new Set();for(const s of c.sections){if(typeof s.id!=='string'||ids.has(s.id)||!Number.isFinite(s.minutes)||s.minutes<1||s.minutes>180||typeof s.title!=='string')throw Error('Séquence invalide.');ids.add(s.id)}
 const slides=new Set();for(const s of c.slides){if(typeof s.id!=='string'||slides.has(s.id)||!ids.has(s.section)||typeof s.title!=='string'||s.title.length>240||!Array.isArray(s.body)||s.body.some(x=>typeof x!=='string'||x.length>3000)||s.body.length>15||!['cover','cards','statement','exercise','game','pause','media','closing'].includes(s.kind))throw Error('Une slide est invalide.');slides.add(s.id);for(const k of ['subtitle','notes','action','tip','answer','explanation','source'])if(s[k]!=null&&(typeof s[k]!=='string'||s[k].length>10000))throw Error('Texte de slide invalide.');if(s.media&&(!['image','audio','video'].includes(s.media.type)||!safeMedia(s.media.src)))throw Error('Média externe ou format non autorisé.');}
 if(c.missions.some(m=>!m||typeof m.title!=='string'||typeof m.task!=='string')||c.memo.some(m=>!m||typeof m.title!=='string'||typeof m.text!=='string'))throw Error('Supports invalides.');
 if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(c.startTime))throw Error('Horaire invalide.');
 return c;
}
export function freshSession(){return {index:0,revealed:false,black:false,clock:{running:false,elapsed:0,anchor:0,startedAt:0},sectionTime:{},activeSection:null,sectionAnchor:0,activityEnd:0,activityLabel:'',votes:[0,0,0],auto:false}}
export function sectionElapsed(state,id,now=Date.now()){return (state.sectionTime[id]||0)+(state.clock.running&&state.activeSection===id?now-state.sectionAnchor:0)}
