export const env: () => Cloudflare.Env = await (async () => {
	try {
		const { env } = await import('cloudflare:workers');
		return () => env;
	} catch (e) {
		return () => {
			throw new Error('Tried to get Worker Environment when not running as a worker!');
		};
	}
})();
