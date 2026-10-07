# VKS — Portfolio de arquitectura (HTML/CSS/JS puro)
**Archivos:** 4 páginas (`index, portfolio, nosotros, contacto`), `css/style.css`, `js/store.js` (datos), `js/main.js` (menú, animaciones, filtros, modal, formulario), `admin/` (panel), `robots.txt`, `sitemap.xml`, `assets/`.
**Local:** `npx serve .` o `python3 -m http.server` y abrir http://localhost:8000 (el `file://` también sirve).
**Vercel:** subir la carpeta a GitHub → vercel.com → New Project → importar → Framework "Other", sin build. O `npx vercel` dentro de la carpeta. Cambiar `TU-DOMINIO.com` en `robots.txt` y `sitemap.xml`.
**Admin:** `/admin/` — usuario `admin`, clave `vks2026` (editar en `admin/admin.js`, constante `CREDS`). NO es seguridad real.
**Agregar obra:** Admin → obras → completar → guardar. Marcar "destacada" (máx. 4) para mostrarla en inicio.
**Datos de contacto:** `contacto.html` (buscar `[EMAIL DEL ESTUDIO]`, `[TELÉFONO]`, `[INSTAGRAM]`, `[DIRECCIÓN]`) y textos `[...]` en `nosotros.html`. Hero: `index.html` (comentario HERO). Imágenes demo: Unsplash; reemplazar por fotos en `assets/images/`.
**Formulario:** `js/main.js`, función `sendForm()` (ejemplos Formspree/EmailJS/backend).
**Necesita backend para producción:** login real, persistencia compartida (hoy `localStorage` vive solo en cada navegador: lo cargado en el admin NO se ve desde otros dispositivos), subida de imágenes, envío de emails. Reemplazar solo las funciones de `js/store.js`.
