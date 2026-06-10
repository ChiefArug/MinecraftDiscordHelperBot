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

/** [curseforge, modrinth] */
export type ModKey = [number | undefined, string | undefined]
export type ModInfo = {
	versions: LoaderVersion[];
	modid: string;
	cfId?: number;
	mrId?: string;
	extra: string[];
};
export class ModMap {
	private cfMods: Map<number, ModInfo> = new Map<number, ModInfo>();
	private mrMods: Map<string, ModInfo> = new Map<string, ModInfo>();

	/**
	 * Update the map with a new mod and associated version
	 * @param key The key of the mod, formatted
	 * @param version The version to be added
	 * @param valueGetter A supplier for the modinfo to be newly inserted. This should pre-contain the current version and cf/mr ids (except the extra property), as those will not be added by the map.
	 * @returns A consumer for adding more data to the extras property.
	 */
	public update(key: ModKey, version: LoaderVersion, valueGetter: () => ModInfo): (extra: string) => void {
		const [cfId, mrId] = key;
		// if both are present we need to do some complicate merging
		if (cfId !== undefined && mrId !== undefined) {
			const cf = this.cfMods.get(cfId);
			const mr = this.mrMods.get(mrId);

			// if they are both undefined then we insert into both the same value
			if (cf === undefined && mr === undefined) {
				const value = valueGetter();
				this.cfMods.set(cfId, value);
				this.mrMods.set(mrId, value);
				// else if only mr is undefined, then we insert into just mr
				return (s) => value.extra.push(s);
			} else if (cf !== undefined && mr === undefined) {
				cf.versions.push(version);
				cf.mrId = mrId;
				this.mrMods.set(mrId, cf);
				return (s) => cf.extra.push(s);
				// ditto reverse for cf
			} else if (cf === undefined && mr !== undefined) {
				mr.versions.push(version);
				mr.cfId = cfId;
				this.cfMods.set(cfId, mr);
				return (s) => mr.extra.push(s);
			} else if (cf !== undefined && mr !== undefined) {
				// if they are the same we can just update one and the other will update due to reference equality
				if (cf === mr) {
					cf.versions.push(version);
					return (s) => cf.extra.push(s);
				} else {
					// not sure what to do here, it should be a very rare case.
					console.error(
						`Divergent CF and MR projects! CF: ${cfId} [${cf.modid} on ${cf.versions.map(([l, v]) => `${l}-${v}`)}], MR: ${mrId} [${mr.modid} on ${mr.versions.map(([l, v]) => `${l}-${v}`)}]]. Adding ${version}`,
					);
					cf.versions.push(version);
					mr.versions.push(version);
					return (s) => {
						cf.extra.push(s);
						mr.extra.push(s);
					};
				}
			}
			// impossible
			return (_) => {};
		} else if (cfId !== undefined) {
			const cf = this.cfMods.get(cfId);
			if (cf !== undefined) {
				return (s) => cf.extra.push(s);
			} else {
				const value = valueGetter();
				this.cfMods.set(cfId, value);
				return (s) => value.extra.push(s);
			}
		} else if (mrId !== undefined) {
			const mr = this.mrMods.get(mrId);
			if (mr !== undefined) {
				return (s) => mr.extra.push(s);
			} else {
				const value = valueGetter();
				this.mrMods.set(mrId, value);
				return (s) => value.extra.push(s);
			}
		} else {
			// empty key
			const { cfId, mrId, modid, versions, extra } = valueGetter();
			console.error(
				`Tried to call ModMap#update with empty key. CF: ${cfId} MR: ${mrId} modid: ${modid} versions: ${versions.map(([l, v]) => `${l}-${v}`)} extra: ${extra}`,
			);
			return (_) => {};
		}
	}

	public getModrinthIds(): string[] {
		return [...this.mrMods.keys()];
	}

	public getCurseForgeIds(): number[] {
		return [...this.cfMods.keys()];
	}

	public getModInfos(): ModInfo[] {
		const set = new Set<ModInfo>();
		for (const value of this.cfMods.values()) {
			set.add(value);
		}
		for (const value of this.mrMods.values()) {
			set.add(value);
		}
		return [...set]
	}

	isEmpty() {
		return this.cfMods.size === 0 && this.mrMods.size === 0;
	}
}
