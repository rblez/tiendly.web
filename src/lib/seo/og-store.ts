const W = 1200;
const H = 630;

function esc(s: string): string {
	return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let cur = '';
	for (const w of words) {
		if (cur && cur.length + 1 + w.length > maxChars) {
			lines.push(cur);
			cur = w;
		} else cur = cur ? `${cur} ${w}` : w;
	}
	if (cur.trim()) lines.push(cur.trim());
	return lines.slice(0, maxLines);
}

export interface OgStoreInput {
	name: string;
	description?: string | null;
	logoUrl?: string | null;
	slug: string;
	accent?: string;
	theme?: 'light' | 'dark';
	productCount?: number;
	variantCount?: number;
}

export function buildOgSvg(i: OgStoreInput): string {
	const { name, description = '', logoUrl, slug, productCount, variantCount } = i;
	const dark = i.theme === 'dark';
	const bg = dark ? '#0d1117' : '#ffffff';
	const fg = dark ? '#f0f6fc' : '#1f2328';
	const muted = dark ? '#8b949e' : '#57606a';
	const hair = dark ? '#30363d' : '#d0d7de';
	const accent = /^#[0-9a-f]{6}$/i.test(i.accent ?? '') ? i.accent! : '#16a34a';

	let logoBlock = '';
	if (logoUrl) {
		logoBlock = `<image href="${esc(logoUrl)}" x="96" y="128" width="240" height="240" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipCircle)" />`;
	} else {
		const initial = esc((name.charAt(0) || 'T').toUpperCase());
		logoBlock = `<text x="216" y="228" font-family="system-ui, sans-serif" font-weight="800" font-size="120" fill="${fg}" text-anchor="middle" dominant-baseline="central">${initial}</text>`;
	}

	const descriptionLines = wrap(description || `Compra en ${name} y pide directo por WhatsApp.`, 85, 3).map(esc);
	const descRender = descriptionLines.map((line, i) => `<text x="430" y="${200 + i * 48}" font-family="system-ui, sans-serif" font-size="34" fill="${muted}">${line}</text>`).join('');

	const chips: Array<[string, string]> = [];
	if (typeof productCount === 'number') chips.push(['↯', `${productCount} productos`]);
	if (typeof variantCount === 'number') chips.push(['◈', `${variantCount} variantes`]);
	if (chips.length === 0) chips.push(['✓', 'Tienda en Tiendly']);

	let chipRow = '';
	let cx = 216;
	for (const [icon, label] of chips) {
		const labelW = label.length * 17 + 26;
		chipRow += `<text x="${cx}" y="268" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="${accent}">${esc(icon)}</text>`;
		chipRow += `<text x="${cx + 30}" y="268" font-family="system-ui, sans-serif" font-size="28" font-weight="500" fill="${muted}">${esc(label)}</text>`;
		cx += 30 + labelW + 48;
	}

	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="clipCircle"><circle cx="216" cy="228" r="104"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect y="0" width="${W}" height="12" fill="${accent}"/>
  <circle cx="216" cy="240" r="120" fill="none" stroke="${hair}" stroke-width="6"/>
  ${logoBlock}
  <text x="392" y="130" font-family="system-ui, sans-serif" font-size="56" font-weight="800" fill="${fg}">${esc(name.length > 100 ? name.slice(0, 100) + '…' : name)}</text>
  <text x="392" y="178" font-family="system-ui, sans-serif" font-size="27" font-weight="500" fill="${muted}">@${esc(slug)}</text>
  ${chipRow}
  ${descRender}
  <rect x="56" y="540" width="1088" height="2" fill="${hair}"/>
  <text x="56" y="584" font-family="system-ui, sans-serif" font-size="25" fill="${muted}">Hecho con <tspan font-weight="700" fill="${accent}">Tiendly</tspan></text>
  <text x="1144" y="584" text-anchor="end" font-family="system-ui, sans-serif" font-size="25" fill="${muted}">tiendly.lat</text>
</svg>`;
}