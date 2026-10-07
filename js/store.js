/* VKS — capa de datos. Hoy usa localStorage; para pasar a backend, reemplazar SOLO el cuerpo de estas funciones
   (ej: return fetch('/api/projects').then(r=>r.json())). El resto del sitio no cambia. */
const VKS_KEY='vks_projects_v1', VKS_MEDIA='vks_media_v1';
const U=(id)=>`https://images.unsplash.com/${id}?w=1400&q=70&auto=format&fit=crop`;
const SEED=[ // DEMO: borrar desde el panel admin
 {id:1,title:'Casa del Parque',location:'Luján',country:'Argentina',year:2025,category:'residencial',area:'280 m²',description:'Una vivienda concebida alrededor de la relación entre luz, materia y espacio exterior. [DATO DE EJEMPLO]',coverImage:U('photo-1600585154340-be6161a56a0c'),gallery:[U('photo-1512917774080-9991f1c4c750'),U('photo-1518005020951-eccb494ad742')],featured:true,status:'publicada'},
 {id:2,title:'Villa 01',location:'Toscana',country:'Italia',year:2024,category:'residencial',area:'340 m²',description:'Volúmenes simples que dialogan con el paisaje. [DATO DE EJEMPLO]',coverImage:U('photo-1512917774080-9991f1c4c750'),gallery:[U('photo-1600585154340-be6161a56a0c')],featured:true,status:'publicada'},
 {id:3,title:'Casa Patio',location:'Luján',country:'Argentina',year:2023,category:'residencial',area:'190 m²',description:'Casa organizada en torno a un patio. [DATO DE EJEMPLO]',coverImage:U('photo-1518005020951-eccb494ad742'),gallery:[],featured:true,status:'publicada'},
 {id:4,title:'Estudio Luján',location:'Luján',country:'Argentina',year:2022,category:'comercial',area:'120 m²',description:'Espacio de trabajo luminoso y sobrio. [DATO DE EJEMPLO]',coverImage:U('photo-1486406146926-c627a92ad1ab'),gallery:[],featured:false,status:'publicada'},
 {id:5,title:'Casa Italia',location:'Lombardía',country:'Italia',year:2025,category:'residencial',area:'220 m²',description:'Proyecto en desarrollo. [DATO DE EJEMPLO]',coverImage:U('photo-1511818966892-d7d671e672a2'),gallery:[],featured:true,status:'publicada'}];
const CFG=window.VKS_CONFIG||{},isCloud=()=>!!CFG.api&&location.protocol!=='file:';
const _read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const _write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){throw new Error('Almacenamiento lleno o bloqueado')}};
/* ---- Datos en Cloudflare R2 a través de /api (funciones de Vercel). Si config.js tiene api vacío: modo demo (localStorage) ---- */
const _tok=()=>localStorage.getItem('vks_at')||'';
async function api(path,o={}){const t=_tok(),h={...o.headers};if(t)h.Authorization='Bearer '+t;if(typeof o.body==='string')h['Content-Type']='application/json';
 const r=await fetch(CFG.api+path,{...o,headers:h}),d=await r.json().catch(()=>({}));
 if(r.status===401&&t&&path!=='/login'){logout();location.reload();throw new Error('sesión vencida')}
 if(!r.ok)throw new Error(d.error||'Error '+r.status);return d}
async function login(user,password){const d=await api('/login',{method:'POST',body:JSON.stringify({user,password})});localStorage.setItem('vks_at',d.token)}
const logout=()=>localStorage.removeItem('vks_at'),hasSession=()=>!!_tok();
const _adm=()=>location.pathname.startsWith('/admin');
/* ---- API de obras (para cambiar de backend, reemplazar solo estas funciones) ---- */
async function getProjects(){if(isCloud())return (await api(_adm()?'/admin/projects':'/projects')).projects;
 let p=_read(VKS_KEY,null);if(!p){p=SEED;_write(VKS_KEY,p)}return p}
async function saveProject(pr){if(isCloud())return (await api('/admin/projects',{method:'POST',body:JSON.stringify(pr)})).project;
 const all=await getProjects();pr.id=Date.now();all.push(pr);_write(VKS_KEY,all);return pr}
async function updateProject(pr){if(isCloud()){await api('/admin/projects/'+pr.id,{method:'PUT',body:JSON.stringify(pr)});return pr}
 _write(VKS_KEY,(await getProjects()).map(x=>x.id===pr.id?pr:x));return pr}
async function deleteProject(id){if(isCloud())return api('/admin/projects/'+id,{method:'DELETE'});_write(VKS_KEY,(await getProjects()).filter(x=>x.id!==id))}
async function getFeaturedProjects(){return (await getProjects()).filter(p=>p.featured&&p.status!=='borrador').slice(0,4)}
/* ---- Media (bucket R2 vía Worker) ---- */
/* Antes de subir se reduce la imagen (máx. 2400 px, WebP): así entra en el límite de 4 MB de Vercel y el sitio carga más rápido */
async function _shrink(f){try{const bm=await createImageBitmap(f),k=Math.min(1,2400/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
 c.getContext('2d').drawImage(bm,0,0,c.width,c.height);const b=await new Promise(r=>c.toBlob(r,'image/webp',.86));if(b&&b.type==='image/webp')return b}catch(e){}return f}
async function uploadImage(f){const b=f.type==='image/gif'?f:await _shrink(f);if(b.size>4e6)throw new Error('La imagen supera 4 MB incluso comprimida');
 return (await api('/upload?name='+encodeURIComponent(f.name.replace(/\.\w+$/,''))+'&type='+encodeURIComponent(b.type),{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:b})).url}
async function listMedia(){return isCloud()?(await api('/list')).urls:_read(VKS_MEDIA,[])}
async function addMediaUrl(u){_write(VKS_MEDIA,[..._read(VKS_MEDIA,[]),u])}
async function deleteMedia(u){if(isCloud())return api('/media/'+u.split('/').pop(),{method:'DELETE'});_write(VKS_MEDIA,_read(VKS_MEDIA,[]).filter(x=>x!==u))}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* renderProjects(lista, contenedor, {link}) — compartido por inicio y portfolio */
function renderProjects(list,el,o={}){
 el.innerHTML=list.length?list.map((p,i)=>`<${o.link?`a href="portfolio.html?p=${p.id}"`:'button type="button"'} class="card" style="--i:${i}" data-id="${p.id}" ${o.reveal?'data-r':''} aria-label="Ver obra ${esc(p.title)}">
 <div class="ph"><img src="${esc(p.coverImage)}" alt="${esc(p.title)}, ${esc(p.location)}" loading="lazy"></div>
 <div class="meta"><i>${String(i+1).padStart(2,'0')}</i><div><h3>${esc(p.title)}</h3><span class="m">${esc(p.location)} / ${esc(p.country)} · ${esc(p.year)} · ${esc(p.category)}</span></div></div></${o.link?'a':'button'}>`).join(''):'<p class="empty">sin obras.</p>'}
