import type { StoreSocial } from '$lib/types';

export const SOCIAL_NETWORKS = [
	{ key: 'fb', label: 'Facebook', icon: 'https://cdn.simpleicons.org/Facebook/FFFFFF', placeholder: 'https://facebook.com/tutienda' },
	{ key: 'ig', label: 'Instagram', icon: 'https://cdn.simpleicons.org/Instagram/FFFFFF', placeholder: 'https://instagram.com/tutienda' },
	{ key: 'yt', label: 'YouTube', icon: 'https://cdn.simpleicons.org/YouTube/FFFFFF', placeholder: 'https://youtube.com/@tutienda' },
	{ key: 'tg', label: 'Telegram', icon: 'https://cdn.simpleicons.org/Telegram/FFFFFF', placeholder: 'https://t.me/tutienda' },
] as const;

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key'];

export interface StoreSocialItem {
	key: SocialKey;
	label: string;
	icon: string;
	url: string;
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
