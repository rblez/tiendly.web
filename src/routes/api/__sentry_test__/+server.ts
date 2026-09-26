import * as Sentry from "@sentry/sveltekit";

export async function GET() {
	Sentry.captureMessage("tiendly-sentry-test");
	throw new Error("tiendly-sentry-test-error");
}
