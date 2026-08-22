<script lang="ts">
	import { fbq, ga4Id, gtag, pixelId } from '$lib/analytics';

	let loaded = false;

	function injectGtag() {
		if (!ga4Id) return;
		const s = document.createElement('script');
		s.async = true;
		s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			((...args: unknown[]) => {
				window.dataLayer!.push(args);
			});
		gtag('js', new Date());
		gtag('config', ga4Id, { send_page_view: false });
	}

	function injectPixel() {
		if (!pixelId) return;
		const inline = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('consent','grant');fbq('track','PageView');`;
		const script = document.createElement('script');
		script.async = true;
		script.textContent = inline;
		document.head.appendChild(script);
	}

	$effect(() => {
		if (loaded) return;
		loaded = true;
		injectGtag();
		injectPixel();
	});
</script>