import { build, files, version } from '$service-worker';

const shellCache = `tiendly-shell-${version}`;
const dataCache = `tiendly-data-${version}`;
const precache = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(shellCache).then((cache) => cache.addAll(precache)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((key) => ![shellCache, dataCache].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

	const request = event.request;
	const isNavigation = request.mode === 'navigate';
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok) {
					const copy = response.clone();
					caches.open(isNavigation ? dataCache : shellCache).then((cache) => cache.put(request, copy));
				}
				return response;
			})
			.catch(() => caches.match(request).then((cached) => cached ?? caches.match('/login'))),
	);
});
