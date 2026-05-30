const base = "https://waifu.chiefarug.workers.dev/"

export const cacheIt = async (value: () => string, key: string): Promise<string> => {
	const cacheKey = new Request(base + key);

	const cache = caches.default;

	let response = await cache.match(cacheKey);

	if (response)
		return await response.text()

	const v = value();

	await cache.put(cacheKey, new Response(v));
	return v;
}
