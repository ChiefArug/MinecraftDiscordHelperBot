import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { GameVersion, NestedArtifact } from '../graphql/graphql.ts';
import { type BoolArg, Command, CommandResult, errorResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { first, LoaderVersion, optionalIndex, regexEscape } from '../lib/util.ts';
import { fillModInfo, FinishedModInfo, ModMap } from '../lib/modInfo.ts';
import { mrModInfos } from '../modrinth.ts';
import { cfModInfos } from '../curseforge.ts';
import { CFMod } from '../lib/cfTypes.ts';
import { Labrinth } from '@modrinth/api-client';

type Project = Labrinth.Projects.v2.Project;

// language=GraphQL
export const JIJ = `query JIJ($predicate: StringPredicate) {
	gameVersions {
		version
		loader
		mods(where: {anyNestedArtifact: {id: $predicate}} first: 10) {
			count
			edges {
				node {
					curseforgeProjectId
					modrinthProjectId
					modIds
					nestedArtifactsFlat {
						id
						version
					}
				}
			}
		}
	}
}`;

export class JijCommand extends Command<StringArg<'locator'> & BoolArg<'regex'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			locator: {
				name: 'locator',
				type: CommandOptionType.STRING,
				description: 'A substring of the (maven) location you want to search for, ie mixinextras-neoforge',
				min_length: 4,
				max_length: 64,
				required: true,
			},
			regex: {
				name: 'regex',
				type: CommandOptionType.BOOLEAN,
				description: 'If the locator should use full regex',
			},
		});
	}

	protected override async executeImpl(
		env: Env,
		getOption: OptionGetter<StringArg<'locator'> & BoolArg<'regex'>>,
		id: string,
	): Promise<CommandResult> {
		const locator = getOption('locator');
		if (!locator) return errorResult('locator parameter is required!');

		const regex = getOption('regex', false);

		const pattern = regex ? locator : regexEscape(locator);
		const result = (await query(JIJ, { predicate: { matches: pattern } })) as {
			gameVersions: GameVersion[];
		};

		const mods: ModMap = new ModMap();
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			const loaderVersion: LoaderVersion = [loader, version];
			for (const { node } of gameVersion.mods.edges) {
				const cfId = node.curseforgeProjectId ?? undefined;
				const mrId = node.modrinthProjectId ?? undefined;
				// ignore anything but the primary modid

				const modid = node.modIds?.[0] ?? node.name ?? 'unknown modid';

				const nestedArtifactsFlat = node.nestedArtifactsFlat as NestedArtifact[];
				const matchingJij = nestedArtifactsFlat
					.filter((na) => na.id.match(pattern))
					.map((na) => `\`${na.id}\` (${na.version})`)

				let extra = mods.update([cfId, mrId], loaderVersion, modid, () => ({
					modid,
					cfId,
					mrId,
					versions: [loaderVersion],
					extra: new Set(),
				}));

				matchingJij.forEach(extra);
			}
		}

		if (mods.isEmpty()) return errorResult(`No mods found containing a jar matching ${locator}`);

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

			const classesString =
				filled.extra.size == 0
					? ''
					: 'Macthed JiJs: ' +
						first(filled.extra, 5)
							.join(', ') +
						(filled.extra.size > 5 ? ` and ${filled.extra.size - 5} more` : '');
			const withExtra: FinishedModInfo = Object.assign(filled, {
				extra: classesString,
			});
			return withExtra;
		});

		return { modInfos, index };
	}
}
