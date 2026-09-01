const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	const current = buckets.get(key);
	if (!current || current.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (current.count >= limit) return false;
	current.count += 1;
	return true;
}

export function clientKey(request: Request, prefix: string): string {
	const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
	return `${prefix}:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`;
}
