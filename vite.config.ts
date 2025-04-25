import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import mkcert from 'vite-plugin-mkcert';
import unfonts from 'unplugin-fonts/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		mkcert(),
		unfonts({
			custom: {
				display: 'swap',
				families: [
					{
						name: 'Geist',
						src: './src/assets/fonts/geist/*.woff2',
						transform(font) {
							const match = font.basename.match(/Geist-(\w+)/);
							const weightMap = {
								Thin: 100,
								ExtraLight: 200,
								Light: 300,
								Regular: 400,
								Medium: 500,
								SemiBold: 600,
								Bold: 700,
								ExtraBold: 800,
								Black: 900
							} as const;

							if (match) {
								const weightName = match[1] as keyof typeof weightMap;
								if (weightName in weightMap) {
									font.weight = weightMap[weightName];
								}
							}

							return font;
						}
					}
				]
			}
		})
	]
});
