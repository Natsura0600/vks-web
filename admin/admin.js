/* VKS admin. Con Cloudflare configurado (js/config.js): login real, datos y subida de imágenes en R2. Sin configurar: modo demo. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],CLOUD=isCloud();
const toast=(m,t='')=>{const d=document.createElement('div');d.className='toast '+t;d.textContent=m;$('#toasts').append(d);setTimeout(()=>{d.classList.add('x');setTimeout(()=>d.remove(),400)},3000)};
const guard=fn=>async(...a)=>{try{return await fn(...a)}catch(e){toast(String(e.message||e).slice(0,140),'err')}};
let P=[],chip='all',gal=[];
const load=async()=>{P=await getProjects()};
/* acceso */
$('#lnote').textContent=CLOUD?'':'Modo demo (sin base de datos): admin / vks2026. No es seguridad real.';
const show=ok=>{$('#login').hidden=ok;$('#app').hidden=!ok;if(ok)go('dash')};
show(CLOUD?hasSession():sessionStorage.getItem('vks_auth')==='1');
$('#lf').onsubmit=guard(async e=>{e.preventDefault();$('#lerr').textContent='';const u=$('#u').value.trim(),p=$('#pw').value;
 if(CLOUD)await login(u,p);else if(u==='admin'&&p==='vks2026')sessionStorage.setItem('vks_auth','1');else{$('#lerr').textContent='credenciales incorrectas.';return}
 show(true)});
$('#out').onclick=()=>{CLOUD?logout():sessionStorage.removeItem('vks_auth');location.reload()};
/* navegación */
async function go(v){$$('[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 $$('[data-s]').forEach(s=>{const on=s.dataset.s===v;s.hidden=!on;if(on){s.classList.remove('vin');void s.offsetWidth;s.classList.add('vin')}});
 await guard(load)();({dash,obras:drawList,media:drawMedia})[v]()}
$$('[data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
/* resumen */
function dash(){const n=f=>P.filter(f).length;
 $('#stats').innerHTML=[['proyectos',P.length],['destacados',n(x=>x.featured)],['argentina',n(x=>x.country==='Argentina')],['italia',n(x=>x.country==='Italia')]].map(([k,v])=>`<div><small>${k}</small><b data-n="${v}">0</b></div>`).join('');
 $$('[data-n]').forEach(b=>{const t=+b.dataset.n;let i=0;const s=()=>{i++;b.textContent=Math.round(t*(1-Math.pow(1-i/30,3)));if(i<30)requestAnimationFrame(s)};s()});
 $('#mode').textContent=CLOUD?'● conectado (Vercel + Cloudflare R2)':'○ modo demo: los datos viven solo en este navegador'}
/* listado */
function drawList(){const q=$('#q').value.toLowerCase();
 const l=P.filter(x=>(chip==='all'||(chip==='feat'?x.featured:x.status==='borrador'))&&(x.title+x.location).toLowerCase().includes(q));
 $('#list').innerHTML=l.length?l.map((x,i)=>`<article class="row" style="--i:${i}"><img src="${esc(x.coverImage)}" alt="" loading="lazy"><div class="ri"><b>${esc(x.title)}</b><small>${esc(x.location)} / ${esc(x.country)} · ${esc(x.year)} · ${esc(x.category)}</small></div>
 <span class="badge ${x.status==='borrador'?'d':''}">${esc(x.status||'publicada')}</span><button class="star ${x.featured?'on':''}" data-a="s" data-id="${x.id}" aria-label="Destacar" title="Destacar en inicio">★</button>
 <div class="acts"><button data-a="e" data-id="${x.id}">editar</button><button data-a="d" data-id="${x.id}">duplicar</button><button data-a="x" data-id="${x.id}">eliminar</button></div></article>`).join(''):'<p class="note">no hay obras. creá la primera con “+ nueva obra”.</p>'}
$('#q').oninput=drawList;
$$('.chips button').forEach(b=>b.onclick=()=>{chip=b.dataset.c;$$('.chips button').forEach(x=>x.classList.toggle('on',x===b));drawList()});
$('#list').onclick=guard(async e=>{const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,p=P.find(x=>x.id===id),a=b.dataset.a;
 if(a==='e')openDr(p);
 if(a==='s'){if(!p.featured&&P.filter(x=>x.featured).length>=4)return toast('ya hay 4 destacadas; quitá una','err');await updateProject({...p,featured:!p.featured});await load();drawList();toast(p.featured?'quitada de destacadas':'destacada ★','ok')}
 if(a==='d'){await saveProject({...p,title:p.title+' (copia)',featured:false,status:'borrador'});await load();drawList();toast('duplicada como borrador','ok')}
 if(a==='x'&&confirm(`¿Eliminar "${p.title}"? No se puede deshacer.`)){b.closest('.row').classList.add('gone');await deleteProject(id);await load();setTimeout(drawList,350);toast('obra eliminada','ok')}});
/* panel lateral de edición */
const F=['title','location','country','year','category','area','status','description','coverImage'];
function prev(){const c=$('#coverImage').value.trim();$('#cprev').hidden=!c;if(c)$('#cprev').src=c;
 $('#gth').innerHTML=gal.map((u,i)=>`<figure><img src="${esc(u)}" alt=""><button type="button" data-g="${i}" aria-label="Quitar">✕</button></figure>`).join('')}
function openDr(p){$('#pf').reset();$$('#pf .err').forEach(x=>x.classList.remove('err'));p=p||{};F.forEach(k=>$('#'+k).value=p[k]??($('#'+k).tagName==='SELECT'?$('#'+k).options[0].value:''));
 $('#id').value=p.id||'';$('#featured').checked=!!p.featured;gal=[...(p.gallery||[])];$('#ft').textContent=p.id?'editar obra':'nueva obra';prev();
 $('#ov').hidden=false;$('#dr').classList.add('open');$('#dr').setAttribute('aria-hidden',false);setTimeout(()=>$('#title').focus(),500)}
const closeDr=()=>{$('#dr').classList.remove('open');$('#dr').setAttribute('aria-hidden',true);$('#ov').hidden=true};
$('#new').onclick=()=>openDr();$('#cx').onclick=$('#cn').onclick=$('#ov').onclick=closeDr;addEventListener('keydown',e=>e.key==='Escape'&&closeDr());
$('#coverImage').oninput=prev;
$('#gurl').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const v=e.target.value.trim();if(v){gal.push(v);e.target.value='';prev()}}};
$('#gth').onclick=e=>{const b=e.target.closest('[data-g]');if(b){gal.splice(+b.dataset.g,1);prev()}};
/* subida de imágenes (arrastrar o elegir) */
const upload=guard(async files=>{if(!CLOUD){toast('Subir archivos requiere configurar el API (js/config.js). Por ahora pegá una URL.','err');return[]}
 const out=[];for(const f of files){if(!f.type.startsWith('image/'))continue;if(f.size>25e6){toast(f.name+' supera 25 MB','err');continue}toast('subiendo '+f.name+'…');out.push(await uploadImage(f))}
 if(out.length)toast(out.length+' imagen(es) subida(s) ✓','ok');return out})
function drop(el,inp,cb){el.onclick=e=>{if(e.target!==inp)inp.click()};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click()}};
 inp.onchange=async()=>{cb(await upload([...inp.files])||[]);inp.value=''};
 ['dragover','dragenter'].forEach(t=>el.addEventListener(t,e=>{e.preventDefault();el.classList.add('over')}));
 ['dragleave','drop'].forEach(t=>el.addEventListener(t,()=>el.classList.remove('over')));
 el.addEventListener('drop',async e=>{e.preventDefault();cb(await upload([...e.dataTransfer.files])||[])})}
drop($('#cdrop'),$('#cfile'),u=>{if(u[0]){$('#coverImage').value=u[0];prev()}});
drop($('#gdrop'),$('#gfile'),u=>{gal.push(...u);prev()});
/* guardar */
$('#pf').onsubmit=guard(async e=>{e.preventDefault();const g=k=>$('#'+k).value.trim();$$('#pf .err').forEach(x=>x.classList.remove('err'));
 const miss=['title','location','year','coverImage'].filter(k=>!g(k));if(miss.length){miss.forEach(k=>$('#'+k).classList.add('err'));return toast('completá los campos marcados','err')}
 const pr={title:g('title'),location:g('location'),country:g('country'),year:+g('year'),category:g('category'),area:g('area'),description:g('description'),coverImage:g('coverImage'),gallery:gal,featured:$('#featured').checked,status:g('status')};
 if(pr.featured&&P.filter(x=>x.featured&&x.id!==+$('#id').value).length>=4)return toast('ya hay 4 destacadas; quitá una','err');
 const b=$('#sv');b.disabled=true;b.textContent='guardando…';
 try{if($('#id').value){pr.id=+$('#id').value;await updateProject(pr)}else await saveProject(pr)}finally{b.disabled=false;b.textContent='guardar obra'}
 closeDr();toast('obra guardada ✓','ok');await load();drawList()});
/* media */
async function drawMedia(){$('#mf').hidden=CLOUD;const l=await guard(listMedia)()||[];
 $('#media').innerHTML=l.length?l.map((u,i)=>`<figure style="--i:${i}"><img src="${esc(u)}" alt="" loading="lazy"><button data-c="${esc(u)}">copiar URL</button><button data-r="${esc(u)}">eliminar</button></figure>`).join(''):'<p class="note">todavía no hay imágenes.</p>'}
drop($('#mdrop'),$('#mfile'),async u=>{if(u.length)drawMedia()});
$('#mf').onsubmit=guard(async e=>{e.preventDefault();const u=$('#murl').value.trim();if(!u)return;await addMediaUrl(u);$('#murl').value='';drawMedia()});
$('#media').onclick=guard(async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.c){await navigator.clipboard.writeText(b.dataset.c);toast('URL copiada ✓','ok')}
 if(b.dataset.r&&confirm('¿Eliminar esta imagen? Si una obra la usa, dejará de verse.')){await deleteMedia(b.dataset.r);drawMedia();toast('imagen eliminada','ok')}});
