import type { Coupon } from '$lib/types';

const KEY_PREFIX = 'tiendly-coupon';

export interface AppliedCoupon {
	code: string;
	type: 'percent' | 'amount';
	value: number;
}

function loadCoupon(slug: string): AppliedCoupon | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(`${KEY_PREFIX}-${slug}`);
		return raw ? (JSON.parse(raw) as AppliedCoupon) : null;
	} catch {
		return null;
	}
}

function saveCoupon(slug: string, coupon: AppliedCoupon) {
	if (typeof window === 'undefined') return;
	sessionStorage.setItem(`${KEY_PREFIX}-${slug}`, JSON.stringify(coupon));
}

function createCouponStore() {
	let state = $state<{ slug: string; coupon: AppliedCoupon | null }>({ slug: '', coupon: null });

	function sync(slug: string) {
		if (state.slug === slug) return;
		state = { slug, coupon: loadCoupon(slug) };
	}

	return {
		get state() {
			return state;
		},
		sync,
		setCoupon(slug: string, coupon: AppliedCoupon) {
			saveCoupon(slug, coupon);
			state = { slug, coupon };
		},
		clearCoupon(slug: string) {
			if (typeof window !== 'undefined') sessionStorage.removeItem(`${KEY_PREFIX}-${slug}`);
			state = { slug, coupon: null };
		},
	};
}

export const couponStore = createCouponStore();