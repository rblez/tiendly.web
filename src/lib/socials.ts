import type { StoreSocial } from '$lib/types';

export const SOCIAL_NETWORKS = [
	{ key: 'fb', label: 'Facebook', icon: 'Facebook', color: '#0866FF', prefix: 'facebook.com/', placeholder: 'tunombre' },
	{ key: 'ig', label: 'Instagram', icon: 'Instagram', color: '#E4405F', prefix: '@', placeholder: 'tutienda' },
	{ key: 'x', label: 'X', icon: 'X', color: '#000000', prefix: '@', placeholder: 'tutienda' },
	{ key: 'yt', label: 'YouTube', icon: 'YouTube', color: '#FF0000', prefix: '@', placeholder: 'tucanal' },
	{ key: 'tg', label: 'Telegram', icon: 'Telegram', color: '#26A5E4', prefix: '@', placeholder: 'tucanal' },
] as const;

export function socialIcon(key: SocialKey, dark: boolean): string {
	const net = SOCIAL_NETWORKS.find((n) => n.key === key);
	if (!net) return '';
	const color = dark ? 'FFFFFF' : net.color.replace('#', '');
	return `https://cdn.simpleicons.org/${net.icon}/${color}`;
}

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key'];

export interface StoreSocialItem {
	key: SocialKey;
	label: string;
	icon: string;
	url: string;
}

export function socialUrl(key: SocialKey, value: string): string {
	const v = value.trim();
	if (!v) return '';
	if (/^https?:\/\//i.test(v)) return v;
	switch (key) {
		case 'fb':
			if (v.startsWith('facebook.com')) return `https://${v}`;
			return `https://facebook.com/${v.replace(/^@/, '')}`;
		case 'ig':
			return `https://instagram.com/${v.replace(/^@/, '')}`;
		case 'x':
			return `https://x.com/${v.replace(/^@/, '')}`;
		case 'yt':
			return `https://youtube.com/@${v.replace(/^@/, '')}`;
		case 'tg':
			return `https://t.me/${v.replace(/^@/, '')}`;
	}
}

export function socialHandle(key: SocialKey, url: string): string {
	const v = url.trim();
	if (!v) return '';
	const domains: Record<SocialKey, string> = {
		fb: 'facebook.com',
		ig: 'instagram.com',
		x: 'x.com',
		yt: 'youtube.com',
		tg: 't.me',
	};
	const out = v
		.replace(/^https?:\/\//i, '')
		.replace(/^www\./i, '')
		.replace(new RegExp(`^${domains[key]}\\/(?:@)?(.*)$`, 'i'), '$1')
		.replace(/^@/, '')
		.trim();
	return out === domains[key] ? '' : out;
}

export function storeSocials(store: { social?: StoreSocial | null } | null): StoreSocialItem[] {
	const raw = store?.social;
	if (!raw) return [];
	const out: StoreSocialItem[] = [];
	for (const net of SOCIAL_NETWORKS) {
		const url = raw[net.key];
		if (typeof url === 'string' && url.trim()) out.push({ key: net.key, label: net.label, icon: net.icon, url: url.trim() });
	}
	return out;
}
