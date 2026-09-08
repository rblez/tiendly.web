import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.tiendly.app',
	appName: 'Tiendly',
	webDir: 'static',
	server: {
		url: 'https://tiendly.lat/login?mobile=1',
		androidScheme: 'https',
		cleartext: false,
		allowNavigation: ['tiendly.lat', '*.tiendly.lat'],
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
			backgroundColor: '#080808',
		},
	},
};

export default config;
