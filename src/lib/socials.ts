import type { StoreSocial } from '$lib/types';

export const SOCIAL_NETWORKS = [
	{ key: 'fb', label: 'Facebook', icon: 'https://cdn.simpleicons.org/Facebook/FFFFFF', placeholder: 'https://facebook.com/tutienda' },
	{ key: 'ig', label: 'Instagram', icon: 'https://cdn.simpleicons.org/Instagram/FFFFFF', placeholder: '@tutienda' },
	{ key: 'x', label: 'X', icon: 'https://cdn.simpleicons.org/X/FFFFFF', placeholder: '@tutienda' },
	{ key: 'yt', label: 'YouTube', icon: 'https://cdn.simpleicons.org/YouTube/FFFFFF', placeholder: '@tutienda' },
	{ key: 'tg', label: 'Telegram', icon: 'https://cdn.simpleicons.org/Telegram/FFFFFF', placeholder: '@tutienda' },
] as const;

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

export function socialDisplay(key: SocialKey, url: string): string {
	const v = url.trim();
	if (!v) return '';
	if (key === 'fb') return /^https?:\/\//i.test(v) ? v : `https://${v}`;
	const handle = v.replace(/^https?:\/\//i, '').replace(/^(instagram|youtube|x|t\.me)\.com\//, '');
	return handle.startsWith('@') ? handle : `@${handle}`;
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
