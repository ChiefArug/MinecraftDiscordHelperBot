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
