# Atlas Virtual de Histología

Sitio web del Atlas Virtual de Histología — Área de Histología y Embriología, Facultad de Ciencias Médicas, UNCUYO.

---

## 0. Nuevo: panel de carga sin código (Decap CMS + Netlify)

Ahora los preparados se pueden cargar desde un panel web con login, sin editar `App.tsx`. Así se activa (una sola vez):

### Paso A — Publicar el sitio en Netlify (gratis)
1. Subí este proyecto a un repositorio de GitHub (igual que antes, ver sección 1 más abajo — GitHub sigue siendo donde vive el código y las fotos).
2. Andá a [app.netlify.com](https://app.netlify.com), creá una cuenta gratis (podés entrar directo con tu cuenta de GitHub) y elegí **"Add new site" → "Import an existing project"**.
3. Conectá tu repositorio `atlas-histologia`. Netlify detecta solo el comando de build (`npm run build`) y la carpeta `dist` gracias al archivo `netlify.toml` que ya está en el proyecto.
4. Esperá a que termine el primer deploy. Tu sitio va a quedar en una URL tipo `https://tu-atlas.netlify.app` (se puede personalizar el nombre gratis, sin comprar dominio).

### Paso B — Activar el login (Netlify Identity + Git Gateway)
1. En el panel de tu sitio en Netlify, andá a **Site configuration → Identity** y hacé clic en **"Enable Identity"**.
2. Bajá a **Services → Git Gateway** y hacé clic en **"Enable Git Gateway"** (esto es lo que le permite al panel escribir cambios en tu repositorio de GitHub sin que cada usuario necesite su propia cuenta de GitHub).
3. En **Identity → Invite users**, invitá tu email y el de tu colega. Les va a llegar un mail para poner contraseña.

### Paso C — Cargar contenido
1. Entrá a `https://tu-atlas.netlify.app/admin/`.
2. Iniciá sesión con el email que invitaste.
3. Ahí vas a ver la colección **"Preparados"**: podés crear uno nuevo, completar nombre, tejido, tinción, subir la foto arrastrándola, y agregar las flechas y anotaciones con un formulario (sin tocar código).
4. Al guardar, el panel hace el commit solo al repositorio de GitHub y el sitio se vuelve a publicar automáticamente en un minuto.

> El sitio publicado en GitHub Pages (sección 1) puede seguir funcionando en paralelo si querés, pero para que el panel `/admin` funcione con login, el sitio tiene que estar servido desde Netlify.

---

## 1. Cómo subir esto a GitHub Pages

### Paso 1 — Crear el repositorio
1. Andá a [github.com/new](https://github.com/new) y creá un repositorio (puede ser público o privado, pero para usar GitHub Pages gratis conviene público). Por ejemplo: `atlas-histologia`.
2. **No** marques "Add a README" (ya tenés uno acá).

### Paso 2 — Subir estos archivos
Desde tu computadora, dentro de esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión del Atlas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/atlas-histologia.git
git push -u origin main
```

(Si no tenés `git` instalado o preferís no usar la terminal, también podés arrastrar todos los archivos y carpetas directamente a la página del repositorio en GitHub, usando "Add file → Upload files". Funciona igual, aunque para subidas grandes es más cómodo con `git`.)

### Paso 3 — Activar GitHub Pages
1. En tu repositorio de GitHub, andá a **Settings → Pages**.
2. En "Build and deployment" → "Source", elegí **GitHub Actions** (no "Deploy from a branch").
3. Listo. El archivo `.github/workflows/deploy.yml` que ya está en el proyecto se encarga de compilar el sitio y publicarlo automáticamente cada vez que hagas `git push` a la rama `main`.
4. Después del primer push, andá a la pestaña **Actions** de tu repo y esperá a que el workflow "Deploy a GitHub Pages" termine (1-2 minutos). Cuando termine, la URL de tu sitio va a aparecer en **Settings → Pages**, algo como:

   `https://TU-USUARIO.github.io/atlas-histologia/`

No hace falta que edites ningún archivo de configuración: la ruta base del sitio se calcula sola a partir del nombre del repositorio.

### Actualizaciones futuras
Cada vez que quieras cambiar algo (agregar fotos, corregir un texto, etc.), simplemente:
```bash
git add .
git commit -m "Actualizo fotos"
git push
```
El sitio se vuelve a publicar solo, automáticamente.

---

## 2. Cómo subir las fotos (lo importante)

Todas las fotos viven en la carpeta **`public/images/`**. La página busca cada foto por su **nombre de archivo exacto**, así que lo único que tenés que hacer es:

1. Sacar/exportar la foto del preparado.
2. Guardarla como **`.jpg`**.
3. Ponerle exactamente el nombre que le corresponde según la tabla de abajo.
4. Arrastrarla a la carpeta `public/images/` (reemplazando el archivo de relleno que ya está puesto ahí).
5. Subir los cambios a GitHub (`git add . && git commit -m "fotos" && git push`, o subiéndola manualmente desde la web de GitHub, entrando a la carpeta `public/images` y usando "Add file → Upload files").

Hoy en día las 4 fotos son **imágenes de relleno** (dice "FOTO PENDIENTE") para que el sitio ya se vea funcionando. Andá reemplazándolas a tu ritmo.

### Tabla: qué foto va en cada archivo

| Archivo (dentro de `public/images/`) | Preparado | Tejido | Tinción |
|---|---|---|---|
| `01-epitelio-estratificado-plano.jpg` | Epitelio Estratificado Plano (no queratinizado) | Tejido Epitelial | H&E |
| `02-mucosa-gastrica.jpg` | Mucosa Gástrica — glándulas fúndicas del estómago | Tejido Epitelial | H&E |
| `03-tejido-conectivo-denso.jpg` | Tejido Conectivo Denso Irregular | Tejido Conectivo | H&E |
| `04-tejido-muscular-esqueletico.jpg` | Tejido Muscular Esquelético (corte longitudinal) | Tejido Muscular | H&E |

**Importante sobre las flechas rojas:** la app no necesita una foto "marcada" y otra "sin marcar" — usa la misma foto y dibuja las flechas encima con código. Por eso solo hace falta **una foto por preparado**.

Las flechas están ubicadas por porcentaje (x%, y%) desde la esquina superior izquierda de la foto. Como tu foto real puede tener el encuadre distinto a la imagen de relleno, es probable que después de poner tu foto quieras ajustar dónde caen las flechas. Eso se hace en `src/App.tsx`, dentro del array `SLIDES`, cambiando los valores de `markers` de cada preparado, por ejemplo:

```ts
markers: [
  { x: 28, y: 14, label: '1' },  // 28% desde la izquierda, 14% desde arriba
  ...
],
```
Podés ir probando valores y ver el resultado corriendo el sitio en tu computadora (ver sección 3) antes de subir el cambio.

### Agregar un preparado nuevo (o todo el bloque "Tejido Nervioso")
La forma recomendada ahora es usar el panel `/admin` (ver sección 0). Si preferís seguir haciéndolo a mano editando código, también se puede:
1. Poné la foto en `public/images/` con un nombre nuevo, por ejemplo `05-nervio-periferico.jpg`.
2. Creá un archivo nuevo en `content/preparados/`, por ejemplo `05-nervio-periferico.json`, copiando la estructura de cualquiera de los que ya están ahí (`id`, `slug`, `name`, `tissue`, `structure`, `stain`, `img`, `markers`, `annotations`). El sitio los detecta solo, no hace falta tocar `App.tsx`.
3. Si es un tejido nuevo (como "Tejido Nervioso"), agregale también un color en `TISSUE_COLORS` dentro de `src/App.tsx` (ya está el de Tejido Nervioso preparado, solo hace falta que uses ese nombre exacto en `tissue`).

---

## 3. Ver el sitio en tu computadora antes de subirlo

Necesitás [Node.js](https://nodejs.org) instalado (versión 20 o más reciente). Después, en esta carpeta:

```bash
npm install
npm run dev
```

Esto abre el sitio en `http://localhost:5173` y se actualiza solo cada vez que guardás un cambio. Así podés revisar cómo quedan las fotos y las flechas antes de subir nada a GitHub.

---

## Estructura del proyecto

```
├── public/
│   └── images/          ← acá van las fotos de los preparados
├── src/
│   ├── App.tsx           ← toda la lógica y el contenido del atlas (SLIDES)
│   ├── index.css         ← estilos globales
│   └── main.tsx          ← punto de entrada de React
├── .github/workflows/
│   └── deploy.yml        ← publica el sitio solo en cada push a main
├── index.html
├── package.json
└── vite.config.ts
```

---

Realizado por Bautista Zarate & Priscila Millanes — Área de Histología y Embriología, UNCUYO.
