# VKS — Portfolio de arquitectura (HTML/CSS/JS + Cloudflare R2)
**Archivos:** 4 páginas, `css/style.css`, `js/store.js` (capa de datos), `js/main.js`, `js/config.js`, `admin/` (panel), `api/[...path].js` (función de Vercel: login + obras + imágenes en R2), `package.json`.
**Local:** `python3 -m http.server`. **Hosting del sitio:** Vercel (sin build, raíz = esta carpeta).
**Datos:** `config.js` vacío = modo demo (admin / vks2026, solo en el navegador). Con `api:'/api'` y las variables de entorno en Vercel = todo en R2.
**Contacto/textos:** reemplazar marcadores `[...]` en `contacto.html` y `nosotros.html`. **Formulario:** función `sendForm()` en `js/main.js`.
