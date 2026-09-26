/**
 * Plantillas de correo transaccional de Tiendly.
 *
 * Estilo minimalista tipo Meta: logo arriba, contenido simple,
 * y abajo información de soporte + enlaces legales. Sin diseño genérico.
 *
 * Uso: `baseEmail({ title, body })` devuelve el HTML completo listo para
 * pegar en las plantillas de Supabase Auth o enviar con cualquier proveedor
 * (Resend, etc.) cuando se integre el envío desde el servidor.
 */

const SITE_URL = "https://tiendly.lat";
const LOGO_URL = `${SITE_URL}/tiendly-logo.webp`;
const SUPPORT_EMAIL = "support@tiendly.lat";
const SUPPORT_TELEGRAM = "https://t.me/TiendlySupport";
const SUPPORT_PHONE = "+5363807214";
const INSTAGRAM_URL = "https://www.instagram.com/tiendly.lat";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61593909631756";
const ADDRESS_LINE = "Santiago de Cuba, Cuba";

export interface BaseEmailOptions {
	/** Título principal del correo */
	title: string;
	/** Contenido HTML del cuerpo (párrafos, código, botón, etc.) */
	body: string;
	/** Texto previo al footer, ej. "Si no fuiste tú, ignora este mensaje." */
	disclaimer?: string;
}

export function baseEmail({ title, body, disclaimer }: BaseEmailOptions): string {
	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Tiendly</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="padding:32px 32px 8px;">
<img src="${LOGO_URL}" alt="Tiendly" width="120" style="display:block;width:120px;height:auto;">
</td></tr>
<tr><td style="padding:16px 32px 8px;color:#18181b;font-size:20px;font-weight:700;">
${title}
</td></tr>
<tr><td style="padding:0 32px 8px;color:#3f3f46;font-size:15px;line-height:1.6;">
${body}
</td></tr>
${disclaimer ? `<tr><td style="padding:8px 32px 0;color:#71717a;font-size:13px;line-height:1.6;">${disclaimer}</td></tr>` : ""}
<tr><td style="padding:24px 32px 8px;">
<hr style="border:none;border-top:1px solid #e4e4e7;margin:0;">
</td></tr>
<tr><td style="padding:8px 32px 0;color:#71717a;font-size:12px;line-height:1.7;">
¿Necesitas ayuda? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:#52525b;">${SUPPORT_EMAIL}</a>, por <a href="${SUPPORT_TELEGRAM}" style="color:#52525b;">Telegram</a> o al <a href="tel:${SUPPORT_PHONE}" style="color:#52525b;">${SUPPORT_PHONE}</a>.
</td></tr>
<tr><td style="padding:4px 32px 0;color:#71717a;font-size:12px;line-height:1.7;">
<a href="${INSTAGRAM_URL}" style="color:#52525b;">Instagram</a> · <a href="${FACEBOOK_URL}" style="color:#52525b;">Facebook</a>
</td></tr>
<tr><td style="padding:4px 32px 32px;color:#a1a1aa;font-size:12px;line-height:1.7;">
<a href="${SITE_URL}/legal/terminos" style="color:#a1a1aa;">Términos</a> · <a href="${SITE_URL}/legal/privacidad" style="color:#a1a1aa;">Privacidad</a><br>
© 2026 Tiendly · ${ADDRESS_LINE}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Ejemplo: correo con código de verificación (estilo Meta). */
export function verificationCodeEmail(code: string): string {
	return baseEmail({
		title: "Hola,",
		body: `<p style="margin:0 0 16px;">Puedes iniciar sesión en tu cuenta de Tiendly con el siguiente código:</p>
<p style="margin:0 0 4px;color:#71717a;font-size:13px;">Código de acceso</p>
<p style="margin:0;padding:16px;background-color:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#18181b;">${code}</p>`,
		disclaimer: "Si no intentaste iniciar sesión, puedes ignorar este mensaje.",
	});
}

/** Ejemplo: bienvenida a un vendedor nuevo. */
export function welcomeEmail(storeName: string, storeUrl: string): string {
	return baseEmail({
		title: `¡Bienvenido a Tiendly, ${storeName}!`,
		body: `<p style="margin:0 0 16px;">Tu tienda ya está creada. Agrégale productos, compártela por WhatsApp y empieza a recibir pedidos hoy mismo.</p>
<p style="margin:0;"><a href="${storeUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver mi tienda</a></p>`,
	});
}
