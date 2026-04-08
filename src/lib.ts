export const clamp = (string: string, length: number = 2000) => {
	if (string.length <= length) {
		return string
	} else {
		return string.substring(0, length - 3) + '...';
	}
}

export const clampInside = (pre: string, post: string, content: string, length: number = 2000) => {
	const extra = pre.length + post.length;
	if (content.length <= (length - extra)) {
		return pre + content + post;
	} else {
		console.log(pre + content.substring(0, length - (extra + 3)) + '...' + post);
		return pre + content.substring(0, length - (extra + 3)) + '...' + post;
	}
}
