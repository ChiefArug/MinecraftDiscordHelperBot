import { CommandOptionType } from '../lib/discord.ts';
import type { GameVersion, Loader } from '../graphql/graphql.ts';
import { type BoolArg, Command, CommandResult, errorResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { query } from '../waifu.ts';
import { mrModInfos } from '../modrinth.ts';
import { fillModInfo, FinishedModInfo, ModMap } from '../lib/modInfo.ts';
import { first, LoaderVersion, optionalIndex } from '../lib/util.ts';
import { cfModInfos } from '../curseforge.ts';
import { CFMod } from '../lib/cfTypes.ts';
import { Labrinth } from '@modrinth/api-client';

type Project = Labrinth.Projects.v2.Project;

// language=GraphQL
const ModId = `query ModId($predicate: StringPredicate) {
    gameVersions {
        version
        loader
        mods(where: {modId: $predicate}, first: 5) {
            edges {
                node {
                    curseforgeProjectId
                    modrinthProjectId

                    modIds
                }
            }
        }
    }
}
`;

type Args = StringArg<'modid'> & BoolArg<'regex'>;

export class ModIdCommand extends Command<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			modid: {
				name: 'modid',
				type: CommandOptionType.STRING,
				description: 'Mod ID to search for',
				min_length: 2,
				max_length: 64,
				required: true,
			},
			regex: {
				name: 'regex',
				type: CommandOptionType.BOOLEAN,
				description: 'If the query should use regex',
				required: false,
			},
		});
	}
	protected async executeImpl(env: Env, getOption: OptionGetter<Args>, id: string): Promise<CommandResult> {
		const regex = getOption('regex', false);
		const modid = getOption('modid');
		if (!modid) return errorResult('modid parameter is required!');

		const predicate = regex ? { matches: modid } : { equals: modid };

		const result = (await query(ModId, { predicate })) as { gameVersions: GameVersion[] };

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
					versions: [loaderVersion],
					extra: new Set(),
				}));

				if (modIds !== undefined && modIds.length > 0)
					modIds.slice(1).forEach(modid => extra(modid));
			}
		}

		if (mods.isEmpty())
			return errorResult(`No mods found with modid ${modid}`);


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
				filled.extra.size == 0 ? '' : 'Other ModIds: ' +
				first(filled.extra, 8)
					.map((e) => `\`${e.split('/').pop()}\``)
					.join(', ') +
				(filled.extra.size > 8 ? ` and ${filled.extra.size - 8} more` : '');
			const withExtra: FinishedModInfo = Object.assign(filled, {
				extra: classesString,
			});
			return withExtra;
		});

		return { modInfos, index };
	}
}
