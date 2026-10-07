/* VKS admin — AUTENTICACIÓN DE DEMO (no segura). Reemplazar por backend real antes de producción. */
const CREDS={u:'admin',p:'vks2026'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const show=ok=>{$('#login').hidden=ok;$('#app').hidden=!ok;if(ok)refresh()};
show(sessionStorage.getItem('vks_auth')==='1');
$('#lf').onsubmit=e=>{e.preventDefault();if($('#u').value===CREDS.u&&$('#pw').value===CREDS.p){sessionStorage.setItem('vks_auth','1');show(true)}else $('#lerr').textContent='credenciales incorrectas.'};
$('#out').onclick=()=>{sessionStorage.removeItem('vks_auth');show(false)};
$$('[data-v]').forEach(b=>b.onclick=()=>{$$('[data-v]').forEach(x=>x.classList.toggle('on',x===b));$$('[data-s]').forEach(s=>s.hidden=s.dataset.s!==b.dataset.v)});
const F=['title','location','country','year','category','area','status','description','coverImage'];
async function refresh(){
 const p=await getProjects(),n=f=>p.filter(f).length;
 $('#stats').innerHTML=[['proyectos',p.length],['destacados',n(x=>x.featured)],['argentina',n(x=>x.country==='Argentina')],['italia',n(x=>x.country==='Italia')]].map(([k,v])=>`<div>${k.toUpperCase()}<b>${v}</b></div>`).join('');
 $('#rows').innerHTML=p.map(x=>`<tr><td>${esc(x.title)}${x.featured?' ★':''}</td><td>${esc(x.location)} / ${esc(x.country)}</td><td>${esc(x.year)}</td><td>${esc(x.category)}</td><td>${esc(x.status||'publicada')}</td>
 <td><button data-a="e" data-id="${x.id}">editar</button><button data-a="d" data-id="${x.id}">duplicar</button><button data-a="x" data-id="${x.id}">eliminar</button></td></tr>`).join('');
 drawMedia(p)}
$('#rows').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,p=(await getProjects()).find(x=>x.id===id);
 if(b.dataset.a==='e'){F.forEach(k=>$('#'+k).value=p[k]??'');$('#id').value=id;$('#gallery').value=(p.gallery||[]).join('\n');$('#featured').checked=!!p.featured;$('#ft').textContent='editar obra';scrollTo(0,0)}
 if(b.dataset.a==='d'){await saveProject({...p,title:p.title+' (copia)',featured:false});refresh()}
 if(b.dataset.a==='x'&&confirm(`¿Eliminar "${p.title}"? No se puede deshacer.`)){await deleteProject(id);refresh()}};
const reset=()=>{$('#pf').reset();$('#id').value='';$('#ft').textContent='nueva obra'};$('#cancel').onclick=reset;
$('#pf').onsubmit=async e=>{e.preventDefault();const m=$('#pmsg');
 const bad=['title','location','year','coverImage'].filter(k=>!$('#'+k).value.trim());if(bad.length){m.textContent='completá: '+bad.join(', ');return}
 const pr={};F.forEach(k=>pr[k]=$('#'+k).value.trim());pr.year=+pr.year;pr.gallery=$('#gallery').value.split('\n').map(s=>s.trim()).filter(Boolean);pr.featured=$('#featured').checked;
 const all=await getProjects();if(pr.featured&&all.filter(x=>x.featured&&x.id!==+$('#id').value).length>=4){m.textContent='ya hay 4 destacadas; quitá una antes.';return}
 if($('#id').value){pr.id=+$('#id').value;await updateProject(pr)}else await saveProject(pr);
 reset();m.textContent='guardado.';refresh()};
/* media */
async function drawMedia(p){const set=new Set([...(await getMedia()),...p.flatMap(x=>[x.coverImage,...(x.gallery||[])])].filter(Boolean));
 $('#media').innerHTML=[...set].map(u=>`<figure><img src="${esc(u)}" alt="" loading="lazy"><button data-c="${esc(u)}">copiar URL</button><button data-r="${esc(u)}">eliminar</button></figure>`).join('')}
$('#mf').onsubmit=async e=>{e.preventDefault();const u=$('#murl').value.trim();if(!u)return;await setMedia([...await getMedia(),u]);$('#murl').value='';refresh()};
$('#media').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.c)navigator.clipboard.writeText(b.dataset.c).then(()=>b.textContent='copiada ✓');
 if(b.dataset.r&&confirm('¿Quitar de media? (no borra la obra que la use)')){await setMedia((await getMedia()).filter(x=>x!==b.dataset.r));refresh()}};
