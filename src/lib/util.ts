import type { Loader } from '../graphql/graphql.ts';

export const clamp = (string: string, length: number = 2000) => {
	if (string.length <= length) {
		return string;
	} else {
		return string.substring(0, length - 3) + '...';
	}
};

export const clampInside = (pre: string, post: string, content: string, length: number = 2000) => {
	const extra = pre.length + post.length;
	if (content.length <= length - extra) {
		return pre + content + post;
	} else {
		return pre + content.substring(0, length - (extra + 3)) + '...' + post;
	}
};

export const sleep = (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// helper function so we only need one ts-expect-error
// for some reason webstorm doesn't think this exists, even though it does.
export const regexEscape = (str: string): string => {
	// @ts-expect-error
	return RegExp.escape(str);
}

export type ListEntries<A extends readonly any[]> = (A)[keyof A & number];


export type LoaderVersion = [Loader, string];

export const checkSuccess = (name: string): (res: Response) => Promise<Response> => {
	return (res) => {
		if (!res.ok)
			return Promise.reject(`${name} returned ${res.statusText}`)
		return Promise.resolve(res);
	}
}

export const isNotUndefined = (t: any) => t !== undefined

// TODO: expand this with more realistic data
// must have prime length
const toCheck = [
	'stu', 'b60bc5b6-d5fc-49ab-8bc5-b6d5fc09abe3', 'ghi',	'def',
	'ghjserhtbh', 'vw', 'chiefarug/mods/stuff', 'f23v.fwef3f',
	'pqr', 'WAIFU', '6789', 'sfsdgsdgg', 'jkl', 'chiefarug',	'abc',
	'45', 'waifu_bot',	'waifu',	'28ru23frf',	'xyz',	'rick',
	'c521dbfa30654ae60f959e6b457740f0',	'mno',	'cw/2dwefsdfsf/', '0123',
];
let check = 0;
/**
 * Checks if a regex matches a suspicious number of strings.
 * @param r The regex to test
 * @returns If the regex matches at least two randomly selected strings out of five
 */
export const isRegexSafe = (r: RegExp): boolean => {
	let failed = false;
	for (let i = 0; i < 5; i++) {
		check += 7;
		check %= toCheck.length;
		const target = toCheck[check];
		if (r.test(target)) {
			if (failed)
				return false;
			failed = true;
		}
	}
	return true;
}

/**
 * Get the first n elements of an iterable efficiently
 * @param iterable The iterable to fetch from
 * @param n The number of elements
 * @param filter Select elements that match the filter first
 */
export const first = <T>(iterable: Iterable<T>, n: number, filter: ((t: T) => boolean) = _ => true): T[] => {
	const iter = iterable[Symbol.iterator]();
	const out = [];
	const spares = [];
	// select ones that match the filter
	while (out.length < n) {
		const v = iter.next();
		if (v.done) break;
		if (filter(v.value)) out.push(v.value);
		else if (spares.length < (n - out.length)) spares.push(v.value);
	}
	// fill with spares
	for (let i = 0; out.length < n && i < spares.length; i++)
		out.push(spares[i]);
	return out;
}

/**
 * Get two indices between min and max that are gap apart and contain target, while optimising for the maximum number of indices either side of target.
 *
 * @param target The target index to always include
 * @param max The maximum index
 * @param min The minimum index
 * @param padding The padding to try and put on either side of the target.
 * @return two indices guaranteed to be between min and max and contain target.
 */
export const pairInRange = (target: number, max: number, min: number = 0, padding: number = 12): [number, number] => {
	return [
		Math.max(min, target - padding),
		Math.min(max, target + padding),
	]
};

/**
 * Get the maximum of a list according to some numerical value
 * @param list The list to calculate the maximum of
 * @param extract The value to use to compare the items in the list
 */
export const max: <T>(list: T[], extract?: (t: T) => number) => T = (list, extract) => {
	if (extract !== undefined) return list.reduce((a, b) => extract(a) > extract(b) ? a : b);
	return list.reduce((a, b) => a > b ? a : b);
}

/**
 * Get the kth element of l, unless either l or k is undefined
 * @param l
 * @param k
 * @return undefined if either parameter is undefined, l[k] otherwise
 */
export const optionalIndex = <K extends string | number | symbol, V>(l: Record<K,V>, k: K | undefined): V | undefined => k ? l[k] : undefined;


export const timeoutFetch = async (input: RequestInfo | URL, timeout?: number, init?: RequestInit<RequestInitCfProperties>): Promise<Response> => {
	let ms = timeout ?? 20_000;
	const r = await Promise.race([
        fetch(input, init),
        sleep(ms)
    ]);
    return r ?? new Response(null, { status: -1, statusText: `Timed out (${ms}ms) while fetching` });
}
