import { Loader } from '../graphql/graphql.ts';

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
		// console.log(pre + content.substring(0, length - (extra + 3)) + '...' + post);
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
 */
export const first = <T>(iterable: Iterable<T>, n: number): T[] => {
	const iter = iterable[Symbol.iterator]();
	const out = [];
	while (n > 0) {
		const v = iter.next();
		if (v.done) break;
		out.push(v.value);
	}
	return out;
}
