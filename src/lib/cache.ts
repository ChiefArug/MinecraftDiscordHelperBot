import { CommandSuccessResult } from './command.ts';

const base = "https://waifu.chiefarug.workers.dev/"

const CACHE_TIME = 12 * 60 * 60; // 12 hours

export type CacheKey<T> = string & {readonly '': unique symbol};

export function commandResultKey(id: number | string) {
	return `command-result/${id}` as CacheKey<CommandSuccessResult>
}


export const saveToCache = async <T extends object>(value: T, key: CacheKey<T>): Promise<void> => {
	const cacheKey = new Request(base + '/' + key);
	const cache = caches.default;
	const cacheValue = new Response(JSON.stringify(value), { headers: { 'cache-control': `max-age=${CACHE_TIME}` } });
	await cache.put(cacheKey, cacheValue);
}

export const getFromCache = async <T extends object>(key: CacheKey<T>): Promise<T | undefined> => {
	const cacheKey = new Request(base + '/' + key);
	const cache = caches.default;
	const cached = await cache.match(cacheKey);
	return cached ? await cached.json() : undefined;
}

export const cacheJson = async <T extends object>(value: () => Promise<T>, key: string): Promise<T> => {
	const cacheKey = new Request(base + 'json/' + key);
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) return await response.json();

	const v = await value();
	await cache.put(cacheKey, new Response(JSON.stringify(v), { headers: { 'cache-control': `max-age=${CACHE_TIME}` } }));
	return v;
}

export const cacheString = async (value: () => Promise<string>, key: string): Promise<string> => {
	const cacheKey = new Request(base + key);
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) return await response.text();

	const v = await value();
	await cache.put(cacheKey,	new Response(v, { headers: { 'cache-control': `max-age=${CACHE_TIME}` } }));
	return v;
}
