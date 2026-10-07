/* VKS — comportamiento común: menú, scroll reveal, transiciones, inicio, portfolio, contacto */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
/* menú */
const body=document.body,burger=$('.burger'),menu=$('#menu');
function setMenu(o){body.classList.toggle('open',o);burger.setAttribute('aria-expanded',o);burger.setAttribute('aria-label',o?'Cerrar menú':'Abrir menú');menu.setAttribute('aria-hidden',!o);
 $$('a',menu).forEach(a=>a.tabIndex=o?0:-1)}
burger.onclick=()=>setMenu(!body.classList.contains('open'));setMenu(false);
addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);closeModal&&closeModal()}});
/* transición entre páginas */
$$('a[href]').forEach(a=>{const h=a.getAttribute('href');if(!h||h[0]==='#'||h.startsWith('mailto')||a.target)return;
 a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();body.classList.add('leaving');setTimeout(()=>location.href=a.href,reduce?0:420)})});
addEventListener('pageshow',e=>{if(e.persisted)body.classList.remove('leaving')});
/* texto palabra por palabra */
$$('[data-split]').forEach(el=>{el.setAttribute('aria-label',el.textContent);el.innerHTML=el.textContent.split(' ').map((w,i)=>`<span class="w" aria-hidden="true" style="transition-delay:${i*90}ms">${w}</span>`).join(' ');el.dataset.r=''});
/* scroll reveal (IntersectionObserver) */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
const observe=()=>$$('[data-r]:not(.in)').forEach(el=>io.observe(el));observe();
/* parallax ligero */
const par=$$('[data-par]');if(par.length&&!reduce){let t=0;addEventListener('scroll',()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;const y=scrollY;if(y<innerHeight*1.2)par.forEach(p=>p.style.transform=`translateY(${y*.12}px)`)})},{passive:true})}
/* inicio: destacados */
const feat=$('#featured');if(feat)getFeaturedProjects().then(l=>{renderProjects(l,feat,{link:true,reveal:true});observe()});
/* portfolio */
const grid=$('#grid'),modal=$('#modal');let all=[],closeModal=null;
if(grid){
 getProjects().then(p=>{all=p.filter(x=>x.status!=='borrador');draw('todos');const id=+new URLSearchParams(location.search).get('p');if(id)open(id)});
 function draw(f){const l=all.filter(p=>f==='todos'||p.country.toLowerCase()===f||p.category===f);renderProjects(l,grid);$('#count').textContent=String(l.length).padStart(2,'0')}
 $$('.filters button').forEach(b=>b.onclick=()=>{$$('.filters button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  $$('.card',grid).forEach(c=>c.classList.add('out'));setTimeout(()=>draw(b.dataset.f),reduce?0:250)});
 grid.onclick=e=>{const c=e.target.closest('.card');if(c)open(+c.dataset.id,c)};
 let last=null;
 function open(id,from){const p=all.find(x=>x.id===id);if(!p)return;last=from;
  $('#mbody').innerHTML=`<div class="info"><h2>${esc(p.title)}</h2><dl><dt>ubicación</dt><dd>${esc(p.location)} / ${esc(p.country)}</dd><dt>año</dt><dd>${esc(p.year)}</dd><dt>categoría</dt><dd>${esc(p.category)}</dd><dt>superficie</dt><dd>${esc(p.area)}</dd></dl><p style="margin-top:24px;max-width:44ch">${esc(p.description)}</p></div>
  <img class="cov" src="${esc(p.coverImage)}" alt="${esc(p.title)}"><div class="gal">${(p.gallery||[]).map((g,i)=>`<img src="${esc(g)}" alt="${esc(p.title)} ${i+2}" loading="lazy">`).join('')}</div>`;
  modal.classList.add('show');modal.setAttribute('aria-hidden',false);body.style.overflow='hidden';$('.mclose').focus();modal.scrollTop=0}
 closeModal=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden',true);body.style.overflow='';last&&last.focus()};
 $('.mclose').onclick=closeModal;
}
/* contacto: validación. ENVÍO REAL: completar sendForm() con Formspree/EmailJS/backend */
const cf=$('#cf');
if(cf){
 async function sendForm(data){
  /* Formspree: await fetch('https://formspree.io/f/TU_ID',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(cf)}); return r.ok
     EmailJS:   await emailjs.send('SERVICE_ID','TEMPLATE_ID',data)  (requiere su <script>)
     Backend:   await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}) */
  console.info('Formulario validado (NO enviado, falta conectar servicio):',data);return false}
 cf.onsubmit=async e=>{e.preventDefault();const m=$('#fmsg');let ok=true;
  $$('input,select,textarea',cf).forEach(f=>{const bad=(f.required&&!f.value.trim())||(f.type==='email'&&f.value&&!/^\S+@\S+\.\S+$/.test(f.value));f.classList.toggle('err',bad);f.setAttribute('aria-invalid',bad);if(bad)ok=false});
  if(!ok){m.textContent='revisá los campos marcados.';return}
  const sent=await sendForm(Object.fromEntries(new FormData(cf)));
  m.textContent=sent?'gracias. te respondemos pronto.':'formulario válido — envío aún no conectado (ver README).';if(sent)cf.reset()}}
