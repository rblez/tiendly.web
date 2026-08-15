# Tiendly — Redesign & Product Evolution Prompt

Quiero que rediseñes y evoluciones Tiendly sin romper la UI/UX existente ni las funcionalidades actuales.

## REGLAS CRÍTICAS

- Antes de modificar código, inspecciona completamente el proyecto.
- Entiende la arquitectura, rutas, componentes, estilos, estado, autenticación, Supabase y flujo actual.
- NO reconstruyas Tiendly desde cero.
- NO cambies tecnologías ni hagas migraciones innecesarias.
- NO elimines funcionalidades existentes.
- NO rompas rutas existentes.
- NO cambies contratos de API, base de datos o autenticación sin comprobar dependencias.
- Mantén el diseño visual actual como referencia y evolúcionalo.
- Reutiliza componentes existentes siempre que sea posible.
- Evita duplicar componentes.
- Mantén responsive design, especialmente mobile.
- Si una nueva feature entra en conflicto con la UI actual, busca primero una solución incremental.
- No hagas cambios masivos sin verificar el impacto.
- Después de cada bloque importante de cambios, comprueba que el proyecto sigue compilando y funcionando.

## OBJETIVO

Tiendly debe evolucionar de ser simplemente un creador de tiendas online a una plataforma para:

1. Emprendedores digitales.
2. Negocios tradicionales.
3. Negocios locales.
4. Personas que necesitan un catálogo online.
5. Vendedores que quieren recibir pedidos/contactos por WhatsApp o Telegram sin necesitar checkout.

Idea central:

> Tu negocio. Tu catálogo. Tus clientes.

Una tienda Tiendly debe poder utilizarse para:

- Comprar directamente.
- Pedir por WhatsApp.
- Contactar por Telegram.
- Reservar una cita.
- Llamar.
- Ver ubicación.
- Coordinar entrega.
- Mostrar únicamente un catálogo.

No todos los vendedores necesitan carrito o pagos online.

# ESTRUCTURA DEL DASHBOARD

El dashboard principal debe seguir teniendo:

- Perfil
- Mis Tiendas
- Tienda

NO agregues nuevas secciones principales al sidebar si no son absolutamente necesarias.

# 1. PERFIL

## Cuenta

- Nombre
- Foto/avatar
- Nombre de usuario
- Email
- Teléfono
- Contraseña
- Cerrar sesión

## Preferencias

- Tema: Dark / Light / Sistema
- Idioma
- Notificaciones
- Preferencias de email

## Seguridad

- Cambiar contraseña
- Sesiones activas
- Cerrar sesiones en otros dispositivos
- 2FA

## Cuenta y datos

- Exportar datos
- Eliminar cuenta

No implementes funciones que todavía no sean necesarias sin inspeccionar primero qué existe.

# 2. MIS TIENDAS

Debe ser el centro de gestión de las tiendas del usuario.

Cada tienda debe mostrar:

- Logo
- Nombre
- @usuario
- Estado publicada/borrador
- Número de productos
- Visitas, si existe analítica
- Pedidos/contactos, si existen
- Última actualización
- Ver tienda
- Editar
- Menú de acciones

## Acciones

- Crear tienda
- Editar
- Vista previa
- Copiar enlace
- Compartir
- Duplicar
- Eliminar
- Publicar/despublicar

## Crear tienda

- Nombre
- @usuario
- Logo
- Portada
- Descripción
- Categoría
- País/ubicación
- WhatsApp
- Telegram
- Redes sociales

La creación debe ser simple y no convertirse en un formulario enorme.

## Configuración general

- Nombre
- Logo
- Favicon
- Descripción
- Categoría
- URL
- Redes sociales
- Contacto
- Ubicación
- Horarios
- Estado abierta/cerrada
- SEO básico
- Compartir en redes

# 3. TIENDA

Dentro de una tienda seleccionada, utiliza navegación secundaria:

- Resumen
- Productos
- Pedidos
- Clientes
- Apariencia
- Configuración

No es necesario implementar todo inmediatamente.

# RESUMEN

Mostrar únicamente métricas que realmente existan:

- Visitas
- Visitantes
- Productos vistos
- Producto más visto
- Clics en WhatsApp
- Clics en Telegram
- Clics en teléfono
- Clics en "Cómo llegar"
- Pedidos
- Ventas
- Conversión
- Últimos pedidos
- Productos destacados
- Actividad reciente

NO inventes estadísticas.

Si una métrica todavía no puede medirse correctamente, no la muestres.

# PRODUCTOS

## Gestión

- Lista de productos
- Crear producto
- Editar producto
- Duplicar producto
- Eliminar producto
- Publicar/despublicar
- Destacar producto
- Marcar como agotado

## Información del producto

- Nombre
- Descripción
- Imágenes
- Precio
- Precio anterior
- Descuento
- Categoría
- SKU
- Disponibilidad
- Stock
- Variantes
- Opciones
- Etiquetas

## Categorías

- Crear categoría
- Editar categoría
- Eliminar categoría
- Ordenar categorías
- Imagen de categoría

## Tipos de producto

- Producto físico
- Producto digital
- Servicio
- Reserva/cita
- Producto personalizado

Diseña el sistema para que un vendedor de servicios no tenga que rellenar campos innecesarios de inventario.

# PEDIDOS

## Estados

- Pendientes
- Confirmados
- En preparación
- En camino
- Completados
- Cancelados

## Información

- Número
- Fecha
- Cliente
- Productos
- Cantidad
- Total
- Método de pago
- Método de entrega
- Dirección
- Notas
- Estado

## Acciones

- Cambiar estado
- Ver detalles
- Contactar cliente
- Cancelar pedido

Si actualmente no existe sistema de pedidos, NO implementes un backend complejo sin inspeccionar primero la arquitectura.

# CLIENTES

- Lista de clientes
- Nombre
- Contacto
- Historial de pedidos
- Total comprado
- Último pedido
- Fecha de registro
- Notas
- Clientes recurrentes
- Segmentos
- Exportar clientes

No conviertas esto todavía en un CRM completo.

# APARIENCIA

## Tema

- Dark
- Light
- Sistema

## Diseño

- Color principal
- Color secundario
- Fondo
- Tipografía
- Bordes
- Radio de tarjetas
- Estilo de botones

## Layout

- Grid
- Lista
- Catálogo
- Productos destacados

## Storefront

- Logo
- Portada
- Banner
- Bio
- Categorías
- Productos destacados
- Footer

## Preview

- Desktop
- Mobile

La interfaz debe tener presets buenos por defecto y no abrumar al vendedor con opciones.

# CONFIGURACIÓN

## Información

- Nombre
- @usuario
- Descripción
- Categoría
- Logo
- Portada

## Contacto

- WhatsApp
- Telegram
- Teléfono
- Email
- Instagram
- Facebook
- X
- TikTok
- YouTube

## Negocio local

- Dirección
- Ubicación en mapa
- Horario
- Días abiertos
- Cómo llegar
- Recogida en local
- Domicilio
- Zonas de entrega

## Botones de acción

El vendedor debe poder elegir la acción principal:

- Comprar
- Pedir por WhatsApp
- Telegram
- Reservar
- Llamar
- Cómo llegar
- Contactar

Esto es una feature importante.

Un negocio no debe estar obligado a utilizar checkout.

# PAGOS

Posibles métodos:

- Pago online
- Pago manual
- Pago al recibir
- Pago en local
- Transferencia
- USDT
- Otros métodos

El pago debe ser opcional.

Una tienda puede funcionar simplemente como:

> CATÁLOGO → WHATSAPP

# ENTREGAS

- Recogida en local
- Domicilio
- Envío
- Zonas de entrega
- Precio de entrega
- Envío gratis desde X cantidad
- Tiempo estimado
- Instrucciones

# URL / DOMINIO

Mantener primero el sistema actual de URL.

Futuro:

- URL Tiendly
- Dominio personalizado
- Conectar dominio
- Verificación DNS
- Redirecciones

NO implementar esto ahora si no existe una base sólida.

# SEO

- Título
- Descripción
- Imagen para compartir
- Indexación

# NOTIFICACIONES

Futuro:

- Nuevo pedido
- Nuevo contacto
- Producto agotado
- Nuevo cliente
- Avisos de Tiendly

# ANALÍTICA

Eventualmente:

- Visitas
- Visitantes
- Productos vistos
- Productos más vistos
- Clics WhatsApp
- Clics Telegram
- Clics teléfono
- Clics "Cómo llegar"
- Pedidos
- Ventas
- Conversión
- Fuente de tráfico

No mostrar datos falsos ni placeholders que parezcan datos reales.

# STOREFRONT / TIENDA PÚBLICA

Este punto es crítico.

La tienda pública debe funcionar tanto para:

A) Ecommerce:

Producto → carrito → checkout

B) Catálogo:

Producto → WhatsApp

C) Negocio local:

Servicio/producto → WhatsApp / Reservar / Cómo llegar

Debe ser configurable por el vendedor.

Ejemplos:

## Barbería

- Servicios
- Precios
- Horarios
- Ubicación
- WhatsApp
- Reservar

## Restaurante

- Menú
- Categorías
- Productos
- WhatsApp
- Recogida
- Domicilio

## Vendedor digital

- Productos digitales
- Servicios
- Telegram
- WhatsApp
- Pago

# PRIORIDAD

## Prioridad 1 — MVP

- Crear tienda
- Editar tienda
- Publicar tienda
- URL pública
- Productos
- Categorías
- Imágenes
- Precios
- Disponibilidad
- Dark / Light
- WhatsApp
- Telegram
- Información de contacto
- Ubicación
- Horarios
- Compartir tienda
- Vista previa mobile
- Vista previa desktop

## Prioridad 2

- Pedidos
- Clientes
- Reservas
- Entregas
- Pagos

## Prioridad 3

- Analítica avanzada
- Dominios personalizados
- SEO avanzado
- CRM
- 2FA
- Automatizaciones

# REGLAS DE UI/UX

1. NO romper la UI actual.
2. NO eliminar componentes existentes sin entender su función.
3. Mantener el lenguaje visual actual.
4. Reutilizar componentes.
5. Mantener responsive.
6. Mobile-first donde sea necesario.
7. Evitar formularios gigantes.
8. Evitar modales innecesarios.
9. Mantener navegación clara.
10. Mantener consistencia entre dashboard y storefront.
11. No añadir botones sin función real.
12. No añadir estadísticas falsas.
13. No crear configuraciones que el usuario no necesite.
14. Usar buenos defaults.
15. Reducir la cantidad de decisiones que debe tomar el vendedor.
16. Mantener accesibilidad razonable.
17. Mantener estados de loading, empty, error y success.
18. Mantener confirmaciones para acciones destructivas.
19. No romper URLs existentes.
20. No romper datos existentes.

# METODOLOGÍA

## Fase 1 — Auditoría

Antes de programar:

- Inspecciona el proyecto completo.
- Identifica stack.
- Identifica rutas.
- Identifica componentes.
- Identifica layouts.
- Identifica estado.
- Identifica Supabase.
- Identifica tablas.
- Identifica APIs.
- Identifica autenticación.
- Identifica sistema de estilos.
- Identifica componentes reutilizables.
- Identifica funcionalidades existentes.
- Identifica deuda técnica relevante.

Después crea un breve plan técnico basado en lo que realmente encuentres.

## Fase 2 — Mapeo

Mapea las features contra la especificación y clasifícalas:

- EXISTE
- PARCIAL
- FALTA
- NO CONVIENE IMPLEMENTAR TODAVÍA

## Fase 3 — Implementación

Implementa primero las mejoras de mayor impacto sin alterar innecesariamente la arquitectura.

## Fase 4 — Pruebas

Comprueba:

- Desktop
- Mobile
- Login
- Registro
- Crear tienda
- Editar tienda
- Publicar tienda
- Añadir producto
- Editar producto
- Storefront público
- WhatsApp
- Telegram
- URLs
- Dark / Light
- Estados vacíos
- Errores
- Loading

## Fase 5 — Regresión

Comprueba que las funcionalidades existentes continúan funcionando.

NO declares terminado simplemente porque compile.

Si encuentras una decisión de arquitectura que requiere romper una parte existente:

- NO la hagas automáticamente.
- Explica el conflicto.
- Propón la alternativa menos destructiva.

# INSTRUCCIÓN INICIAL

Empieza ahora por la AUDITORÍA DEL PROYECTO.

NO empieces modificando código inmediatamente.

Primero inspecciona y comprende Tiendly, identifica qué existe actualmente y presenta el plan técnico antes de implementar cambios.
