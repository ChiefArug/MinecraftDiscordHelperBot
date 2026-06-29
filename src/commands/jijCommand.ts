import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { GameVersion, Loader, NestedArtifact } from '../graphql/graphql.ts';
import { type BoolArg, Command, CommandResult, errorResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { regexEscape } from '../lib/util.ts';

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
		// The method works both locally and on workers, it's just not recognised.
		const pattern = regex ? locator : regexEscape(locator);
		const result = (await query(JIJ, { predicate: { matches: pattern } })) as {
			gameVersions: GameVersion[];
		};

		const cfMods: Record<number, `[${string}] ${Loader} ${string}`[]> = {};
		const mrMods: Record<string, `[${string}] ${Loader} ${string}`[]> = {};
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			for (const { node } of gameVersion.mods.edges) {
				const cf = node.curseforgeProjectId;
				const mr = node.modrinthProjectId;
				let nestedArtifactsFlat = node.nestedArtifactsFlat as NestedArtifact[];
				const jijed = nestedArtifactsFlat?.length ?? -1;
				const modids = node.modIds as string[];
				const matchingJij = nestedArtifactsFlat
					.filter((na) => na.id.match(pattern))
					.map((na) => `\`${na.id}\` (${na.version})`)
					.join(',');
				const modidsDisplay = modids.map((m) => `\`${m}\``).join(',');
				if (cf) (cfMods[cf] ??= []).push(`[${modidsDisplay}] ${loader} ${version} has ${jijed} jar(s) inside. Matched: ${matchingJij}`);
				if (mr) (mrMods[mr] ??= []).push(`[${modidsDisplay}] ${loader} ${version} has ${jijed} jar(s) inside. Matched: ${matchingJij}`);
			}
		}

		if (Object.keys(cfMods).length === 0 && Object.keys(mrMods).length === 0)
			return errorResult(`No mods found containing a jij matching ${locator}`);

		const wrap = <T extends string | number>(prefix: string, values: Record<T, `[${string}] ${Loader} ${string}`[]>): string => {
			return Object.entries(values)
				.map(([id, versionString]) => {
					return `${prefix}${id} ${versionString}`;
				})
				.join('\n');
		};

		return errorResult(
				`Mods found: \nModrinth: ${wrap('https://modrinth.com/mod/', mrMods)}\nCurseForge: ${wrap('https://cflookup.com/', cfMods)}`,
			);
	}
}
