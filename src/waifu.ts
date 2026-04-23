export const query: (q: string, variables?: Record<string, any>) => Promise<object | undefined> = await (async () => {
	try {
		const { env } = await import('cloudflare:workers');
		const URL = 'https://waifu.neoforged.net/api/graphql';

		return async (q: string, variables: Record<string, any> = {}): Promise<object | undefined> => {
			const response = await fetch(URL, {
				method: 'POST',
				headers: {
					Authorization: env.WAIFU_TOKEN,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					query: q,
					variables: variables,
				}),
			});
			if (response.status !== 200)
				console.error(`Failed to fetch from WAIFU. Unknown status code recieved back: ${response.status} [${response.statusText}]`);

			const body = (await response.json()) as { error: string; data: object };
			if ('error' in body) {
				console.error(`Query had errors: ${body['error']}`);
				return;
			} else if ('data' in body) {
				// console.log(body);
				return body['data'];
			}
			console.error('unknown grahql response: ' + body);
		};
	} catch (e) {
		return () => {
			throw new Error('Tried to query WAIFU when not running as a worker!');
		};
	}
})();
