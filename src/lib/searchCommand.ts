import { Command, type CommandResult, errorResult, type OptionGetter } from './command.ts';
import type { CommandOptions } from './discord.ts';
import { query } from '../waifu.ts';
import type { Labrinth } from '@modrinth/api-client';
import type { GameVersion, Mod } from '../graphql/graphql.ts';
import { type FilledModInfo, fillModInfo, ModMap } from './modInfo.ts';
import { type LoaderVersion, optionalIndex } from './util.ts';
import { mrModInfos } from '../modrinth.ts';
import { cfModInfos } from '../curseforge.ts';
import type { CFMod } from './cfTypes.ts';

type Project = Labrinth.Projects.v2.Project;


export abstract class SearchCommand<O extends CommandOptions> extends Command<O> {
	/**
	 * Parse the options into parameters to pass to the query
	 * @param getOption Function to get values of options.
	 * @protected
	 * @returns An error string if an option is invalid, or a record (possibly empty) of options if not.
	 */
	protected abstract parseOptions(getOption: OptionGetter<O>): string | Record<string, any>;

	/**
	 * Get the query for this command.
	 * @protected
	 */
	protected abstract getQuery(): string;

	/**
	 * Parse out extra data from the result returned and attach it as extra data.
	 * @param node Data about the mod.
	 * @param addExtra Call this with any extra data to be added
	 * @protected
	 */
	protected abstract attachExtras(node: Mod, addExtra: (extra: string) => void): void;

	/**
	 * Process the 'extra' data from the provided FilledModInfo into a single string for display.
	 * @param mod The mod containing the extra data
	 * @protected
	 */
	protected abstract processExtras(mod: FilledModInfo): string;

	protected async executeImpl(env: Env, getOption: OptionGetter<O>, id: string): Promise<CommandResult> {
		const variables = this.parseOptions(getOption);
		if (typeof variables === 'string') return errorResult(variables);

		const result = await query(this.getQuery(), variables) as { gameVersions: GameVersion[] };

		const mods: ModMap = new ModMap();
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			const loaderVersion: LoaderVersion = [loader, version];
			for (const { node } of gameVersion.mods.edges) {
				const cfId = node.curseforgeProjectId ?? undefined;
				const mrId = node.modrinthProjectId ?? undefined;
				// ignore anything but the primary modid
				const modIds: string[] | undefined = node.modIds ?? undefined;
				const modid = modIds?.[0] ?? node.name ?? 'unknown modid';

				let extra = mods.update([cfId, mrId], loaderVersion, modid, () => ({
					modid,
					cfId,
					mrId,
					versions: new Set([loaderVersion]),
					extra: new Set(),
				}));
				this.attachExtras(node, extra);
			}
		}

		if (mods.isEmpty()) return errorResult(`No mods found!`);

		const [mrModInfo, { data: cfModInfo }] = await Promise.all([mrModInfos(mods.getModrinthIds()), cfModInfos(mods.getCurseForgeIds())]);

		const mrMods: Record<string, Project> = mrModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<string, Project>,
		);
		const cfMods: Record<number, CFMod> = cfModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<number, CFMod>,
		);

		const blockedIndices = new Set();
		const index: Record<string, number> = {};
		function addIndex(key: string, i: number) {
			if (key in index || blockedIndices.has(key)) {
				blockedIndices.add(key);
				delete index[key];
			} else {
				index[key] = i;
			}
		}
		const modInfos = mods.getModInfos().map((modInfo, i) => {
			const filled = fillModInfo(modInfo, optionalIndex(cfMods, modInfo.cfId), optionalIndex(mrMods, modInfo.mrId));

			addIndex(filled.modid, i);
			if (filled.displayName !== undefined) addIndex(filled.displayName, i);
			for (const link in filled.links) addIndex(link, i);
			if (filled.cfId !== undefined) addIndex(String(filled.cfId), i);
			if (filled.mrId !== undefined) addIndex(String(filled.mrId), i);

			return Object.assign(filled, {
				versions: [...filled.versions],
				extra: this.processExtras(filled),
			});
		});

		return { modInfos, index };
	}

}
