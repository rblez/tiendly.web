

# Tiendly

**SaaS de tiendas online para Cuba.**

Tiendly permite a emprendedores crear y administrar su propia tienda online, publicar productos y recibir pedidos con los métodos de pago que cada vendedor configure.

> 🚧 **Tiendly está actualmente en beta activa.**

---

## ✨ Características

- 🛍️ Creación de tiendas online
- 📦 Gestión de productos
- 🖼️ Subida de imágenes
- 💳 Métodos de pago configurables por cada vendedor
- 💵 Soporte para **USD y CUP**
- 📱 Diseño adaptado a dispositivos móviles
- 🧾 Checkout para procesar pedidos
- 💬 WhatsApp como canal opcional de contacto
- 🔐 Autenticación de usuarios
- ☁️ Infraestructura basada en Cloudflare y Supabase
- 📲 Aplicación Android mediante Capacitor

---

## 💳 Métodos de pago

Tiendly permite que cada vendedor configure cómo quiere cobrar.

Los métodos integrados actualmente incluyen:

- Transferencia CUP
  - BANDEC
  - BPA
  - BANMET
  - MITRANSFER
  - Transfermóvil
  - EnZona
- QvaPay QUSD
- USDT
- Saldo Móvil (ETECSA)
- PayPal
- Zelle

También es posible crear métodos de pago personalizados para aquellos medios que no estén incluidos como opciones predeterminadas.

Cada método de pago puede utilizar su logo oficial y permite personalizarlo cuando sea necesario.

---

## 💰 Monedas

Tiendly está diseñado principalmente para trabajar con:

- **USD**
- **CUP**

El vendedor puede seleccionar la moneda principal de su tienda.

También puede establecer las condiciones de conversión utilizadas para mostrar precios equivalentes en la otra moneda.

Ejemplo:

```text
USD → CUP

60 USD × 650 CUP = 39,000 CUP

o:

CUP → USD

6,000 CUP ÷ 650 = 9.23 USD

Las tasas utilizadas pueden depender del método de pago configurado por el vendedor.


---

🧑‍💻 Stack tecnológico

Frontend

SvelteKit 2

Svelte 5

TypeScript

Tailwind CSS

Vite


Backend / Servicios

Supabase

Supabase Auth

Supabase Storage


Infraestructura

Cloudflare

Cloudflare Workers / Pages

Wrangler


Aplicación móvil

Capacitor

Android



---

📁 Estructura del proyecto

tiendly.web/
├── .github/
│   └── workflows/
├── android/
├── src/
│   ├── lib/
│   └── routes/
├── static/
├── package.json
├── package-lock.json
├── svelte.config.js
├── vite.config.ts
├── wrangler.toml
└── README.md


---

🚀 Desarrollo local

Requisitos

Node.js 22+

npm

Git


Instalar dependencias

npm install

Iniciar servidor de desarrollo

npm run dev

La aplicación estará disponible normalmente en:

http://localhost:5173


---

🔎 Comprobaciones

Antes de realizar cambios importantes o crear un Pull Request:

npm run check

Comprobar formato:

npm run format:check

Formatear el proyecto:

npm run format

Crear build de producción:

npm run build


---

☁️ Cloudflare

Tiendly utiliza Cloudflare como infraestructura de despliegue.

La configuración principal se encuentra en:

wrangler.toml

El proyecto utiliza el adaptador de Cloudflare para SvelteKit.

El despliegue de producción se gestionará mediante GitHub Actions.


---

🗄️ Supabase

Supabase proporciona los servicios principales de backend:

Autenticación

Base de datos

Storage

Gestión de usuarios

Archivos multimedia


Las variables de entorno necesarias deben configurarse localmente y también en el entorno de despliegue.

Nunca deben incluirse claves privadas o secrets directamente en el repositorio.


---

🖼️ Imágenes

Las imágenes de usuarios y productos se almacenan en Supabase Storage.

El endpoint de subida se encuentra en:

src/routes/api/upload-image/+server.ts

Las subidas están protegidas mediante autenticación y límites de frecuencia.


---

📱 Android

La aplicación Android utiliza Capacitor.

Comandos relacionados:

npm run cap:assets

npm run cap:sync

El proyecto Android se encuentra en:

android/

Las builds de Android pueden generarse mediante GitHub Actions.


---

🔄 Versionado

Tiendly utiliza Semantic Versioning:

MAJOR.MINOR.PATCH

Ejemplos:

0.0.41
0.0.42
0.1.0
1.0.0

Tipos de cambios

PATCH

Cambios pequeños, correcciones y bugs:

0.0.41 → 0.0.42

MINOR

Nuevas funcionalidades compatibles:

0.0.42 → 0.1.0

MAJOR

Cambios que introducen incompatibilidades importantes:

0.1.0 → 1.0.0

El proceso automatizado de versionado y releases se gestionará mediante GitHub Actions.


---

🔁 GitHub Actions

La automatización del proyecto está organizada dentro de:

.github/workflows/

Los workflows previstos incluyen:

ci.yml
version.yml
release.yml
deploy.yml
rollback.yml
android-apk.yml

CI

Comprueba automáticamente:

Instalación de dependencias

TypeScript / Svelte

Formato

Build


Versionado

Permite incrementar:

patch
minor
major

y crear el correspondiente Git tag.

Releases

Genera releases de GitHub a partir de las versiones etiquetadas.

Deploy

Gestiona el despliegue de producción en Cloudflare.

Rollback

Permite volver a una versión anterior del despliegue cuando sea necesario.

Android

Genera la aplicación Android mediante Capacitor.

> Estos workflows pueden incorporarse progresivamente al proyecto. El README describe la arquitectura prevista y no implica que todos estén activos actualmente.




---

🌿 Flujo de trabajo

El flujo recomendado es:

Nueva funcionalidad
       │
       ▼
  Pull Request
       │
       ▼
      CI
       │
       ▼
    Review
       │
       ▼
     main
       │
       ▼
   Cloudflare

Para publicar una nueva versión:

main
 │
 ▼
Version
 │
 ├── Actualiza package.json
 ├── Actualiza package-lock.json
 ├── Crea commit
 └── Crea tag
       │
       ▼
     Release
       │
       ▼
      APK


---

🔐 Seguridad

No subir nunca al repositorio:

.env
.env.local
.env.production
API keys
Service Role Keys
Cloudflare API Tokens
Credenciales privadas

Las credenciales utilizadas por GitHub Actions deben almacenarse como GitHub Secrets.


---

🧪 Estado del proyecto

Tiendly se encuentra actualmente en:

Beta activa

El proyecto continúa en desarrollo y algunas funcionalidades pueden cambiar antes de la versión estable.


---

📄 Licencia

Este proyecto es propiedad de Tiendly.

La licencia y las condiciones de uso se definirán de acuerdo con la política del proyecto.


---

🌐 Tiendly

Sitio web:

https://www.tiendly.lat

Repositorio:

https://github.com/rblez/tiendly.web