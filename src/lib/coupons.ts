import type { Coupon } from '$lib/types';

export function normalizeCouponCode(code: string): string {
	return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function couponDiscount(coupon: Pick<Coupon, 'type' | 'value'> | null, subtotal: number): number {
	if (!coupon || subtotal <= 0) return 0;
	if (coupon.type === 'percent') {
		return Math.round(subtotal * coupon.value) / 100;
	}
	return Math.min(coupon.value, subtotal);
}

export function couponIsValid(coupon: Coupon | null): boolean {
	if (!coupon) return false;
	if (!coupon.active) return false;
	if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return false;
	if (coupon.max_uses != null && coupon.uses >= coupon.max_uses) return false;
	return true;
}

export function couponLabelText(coupon: Pick<Coupon, 'type' | 'value'> | null): string {
	if (!coupon) return '';
	return coupon.type === 'percent' ? `${coupon.value}%` : `${coupon.value.toFixed(2)}`;
}