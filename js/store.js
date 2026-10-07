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
const _read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const _write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){alert('No se pudo guardar (almacenamiento lleno o bloqueado)')}};
async function getProjects(){let p=_read(VKS_KEY,null);if(!p){p=SEED;_write(VKS_KEY,p)}return p}
async function saveProject(pr){const all=await getProjects();pr.id=Date.now();all.push(pr);_write(VKS_KEY,all);return pr}
async function updateProject(pr){const all=(await getProjects()).map(x=>x.id===pr.id?pr:x);_write(VKS_KEY,all);return pr}
async function deleteProject(id){_write(VKS_KEY,(await getProjects()).filter(x=>x.id!==id))}
async function getFeaturedProjects(){return (await getProjects()).filter(p=>p.featured&&p.status!=='borrador').slice(0,4)}
async function getMedia(){return _read(VKS_MEDIA,[])} // MEDIA: URLs. Para Cloudinary/Supabase, subir y guardar la URL resultante
async function setMedia(l){_write(VKS_MEDIA,l)}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* renderProjects(lista, contenedor, {link}) — compartido por inicio y portfolio */
function renderProjects(list,el,o={}){
 el.innerHTML=list.length?list.map((p,i)=>`<${o.link?`a href="portfolio.html?p=${p.id}"`:'button type="button"'} class="card" style="--i:${i}" data-id="${p.id}" ${o.reveal?'data-r':''} aria-label="Ver obra ${esc(p.title)}">
 <div class="ph"><img src="${esc(p.coverImage)}" alt="${esc(p.title)}, ${esc(p.location)}" loading="lazy"></div>
 <div class="meta"><i>${String(i+1).padStart(2,'0')}</i><div><h3>${esc(p.title)}</h3><span class="m">${esc(p.location)} / ${esc(p.country)} · ${esc(p.year)} · ${esc(p.category)}</span></div></div></${o.link?'a':'button'}>`).join(''):'<p class="empty">sin obras.</p>'}
