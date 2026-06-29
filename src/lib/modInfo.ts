import { LoaderVersion } from './util.ts';
import { PartialEmoji } from './discord.ts';
import { ModrinthProject } from '../modrinth.ts';
import { CFMod } from './cfTypes.ts';
import { CURSEFORGE, GITHUB, MODRINTH } from './emoji.ts';

/** [curseforge, modrinth] */
export type ModKey = [number | undefined, string | undefined];
export type ModInfo = {
	versions: LoaderVersion[];
	modid: string;
	cfId?: number;
	mrId?: string;
	extra: Set<string>;
};
export type FilledModInfo = ModInfo & {
	displayName?: string;
	links: Record<string, PartialEmoji>;
	imageUrl?: string;
}
export type FinishedModInfo = Omit<FilledModInfo, 'extra'> & {
	extra: string;
}

/**
 * Fill the provided modInfo with additional data from CurseForge and/or Modrinth
 * @param modInfo The base mod information
 * @param cf Information about this mod from CurseForge
 * @param mr Information about this mod from Modrinth
 */
export function fillModInfo(modInfo: ModInfo, cf?: CFMod, mr?: ModrinthProject): FilledModInfo {
	const links: Record<string, PartialEmoji> = {};
	if (cf?.slug !== undefined) links[`https://www.curseforge.com/minecraft/mc-mods/${cf?.slug}`] = CURSEFORGE;
	if (mr?.slug !== undefined) links[`https://modrinth.com/mod/${mr?.slug}`] = MODRINTH;
	const ghSlug = findGithubSlug(cf, mr);
	if (ghSlug !== undefined) links[`https://github.com/${ghSlug}`] = GITHUB;

	return Object.assign(modInfo, {
		displayName: cf?.name ?? mr?.title,
		links: links,
		imageUrl: cf?.logo.url ?? mr?.icon_url,
	});
}

const githubRegex = new RegExp('https://(?:www\.)?github.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)(?:/.*)?', '');
function findGithubSlug(cf?: CFMod, mr?: ModrinthProject) {
	const all = [
		cf?.links.issuesUrl ?? undefined,
		cf?.links.sourceUrl ?? undefined,
		mr?.issues_url ?? undefined,
		mr?.source_url ?? undefined,
		mr?.wiki_url ?? undefined,
	];
	for (const url of all) {
		if (url === undefined) continue;
		const match = url.match(githubRegex);
		if (match === null) continue;
		const slug = match[1];
		if (slug === undefined) continue;
		return slug;
	}
}

export class ModMap {
	private cfMods: Map<number, ModInfo> = new Map<number, ModInfo>();
	private mrMods: Map<string, ModInfo> = new Map<string, ModInfo>();
	private jiJars: Map<string, ModInfo> = new Map<string, ModInfo>();

	/**
	 * Update the map with a new mod and associated version
	 * @param key The key of the mod, formatted
	 * @param version The version to be added
	 * @param modid The primary modid of the mod
	 * @param valueGetter A supplier for the modinfo to be newly inserted. This should pre-contain the current version and cf/mr ids (except the extra property), as those will not be added by the map.
	 * @returns A consumer for adding more data to the extras property.
	 */
	public update(key: ModKey, version: LoaderVersion, modid: string, valueGetter: () => ModInfo): (extra: string) => void {
		const [cfId, mrId] = key;
		// if both are present we need to do some complicated merging
		if (cfId !== undefined && mrId !== undefined) {
			const cf = this.cfMods.get(cfId);
			const mr = this.mrMods.get(mrId);

			// if they are both undefined then we insert into both the same value
			if (cf === undefined && mr === undefined) {
				const value = valueGetter();
				this.cfMods.set(cfId, value);
				this.mrMods.set(mrId, value);
				// else if only mr is undefined, then we insert into just mr
				return (s) => value.extra.add(s);
			} else if (cf !== undefined && mr === undefined) {
				cf.versions.push(version);
				cf.mrId = mrId;
				this.mrMods.set(mrId, cf);
				return (s) => cf.extra.add(s);
				// ditto reverse for cf
			} else if (cf === undefined && mr !== undefined) {
				mr.versions.push(version);
				mr.cfId = cfId;
				this.cfMods.set(cfId, mr);
				return (s) => mr.extra.add(s);
			} else if (cf !== undefined && mr !== undefined) {
				// if they are the same we can just update one and the other will update due to reference equality
				if (cf === mr) {
					cf.versions.push(version);
					return (s) => cf.extra.add(s);
				} else {
					// not sure what to do here, it should be a very rare case.
					console.error(
						`Divergent CF and MR projects! CF: ${cfId} [${cf.modid} on ${cf.versions.map(([l, v]) => `${l}-${v}`)}], MR: ${mrId} [${mr.modid} on ${mr.versions.map(([l, v]) => `${l}-${v}`)}]]. Adding ${version}`,
					);
					cf.versions.push(version);
					mr.versions.push(version);
					return (s) => {
						cf.extra.add(s);
						mr.extra.add(s);
					};
				}
			}
			// impossible
			return (_) => {};
		} else if (cfId !== undefined) {
			const cf = this.cfMods.get(cfId);
			if (cf !== undefined) {
				cf.versions.push(version);
				return (s) => cf.extra.add(s);
			} else {
				const value = valueGetter();
				this.cfMods.set(cfId, value);
				return (s) => value.extra.add(s);
			}
		} else if (mrId !== undefined) {
			const mr = this.mrMods.get(mrId);
			if (mr !== undefined) {
				mr.versions.push(version);
				return (s) => mr.extra.add(s);
			} else {
				const value = valueGetter();
				this.mrMods.set(mrId, value);
				return (s) => value.extra.add(s);
			}
		} else {
			// empty key
			const current = this.jiJars.get(modid);
			if (current === undefined) {
				const value = valueGetter();
				this.jiJars.set(modid, value);
				return (s) => value.extra.add(s);
			} else {
				current.versions.push(version);
				return (s) => current.extra.add(s);
			}
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
		for (const value of this.jiJars.values()) {
			set.add(value);
		}
		return [...set];
	}

	isEmpty() {
		return this.cfMods.size === 0 && this.mrMods.size === 0;
	}
}
