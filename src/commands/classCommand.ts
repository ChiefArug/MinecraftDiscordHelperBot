import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { GameVersion } from '../graphql/graphql.ts';
import { errorResult, type BoolArg, Command, CommandResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { first, isRegexSafe, LoaderVersion } from '../lib/util.ts';
import { fillModInfo, FinishedModInfo, ModMap } from '../lib/modInfo.ts';
import { mrModInfos } from '../modrinth.ts';
import { cfModInfos } from '../curseforge.ts';
import { CFMod } from '../lib/cfTypes.ts';
import { Labrinth } from '@modrinth/api-client';

type Project = Labrinth.Projects.v2.Project;

// language=GraphQL
export const Class = `query Class($predicate: StringPredicate) {
	gameVersions {
		version
		loader
		mods(where: {anyClass: {name: $predicate}}) {
			count
			edges {
				node {
					curseforgeProjectId
					modrinthProjectId
					modIds
					classes (where: {name: $predicate}) {
						name
					}
				}
			}
		}
	}
}`;

type Args = StringArg<'class'> & BoolArg<'regex'>;
const optionalIndex = <K extends string | number | symbol, V>(l: Record<K,V>, k: K | undefined): V | undefined => k ? l[k] : undefined;
export class ClassCommand extends Command<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			class: {
				name: 'class',
				type: CommandOptionType.STRING,
				description: 'The classname to search for, in JVM format (ie java/lang/Character$Subset)',
				min_length: 4,
				max_length: 128,
				required: true,
			},
			regex: {
				name: 'regex',
				type: CommandOptionType.BOOLEAN,
				description: 'If the locator should use full regex',
			},
		});
	}

	protected override async executeImpl(env: Env, getOption: OptionGetter<Args>): Promise<CommandResult> {
		const className = getOption('class');
		if (!className) return errorResult('class parameter is required!');

		const regex = getOption('regex', false);

		if (!regex && className.includes('.'))
			return errorResult('class parameter needs to be in JVM format, not java format! Use `/` instead of `.` for package separation, and `$` instead of `.` for inner class separation.');
		if (regex && !isRegexSafe(new RegExp(className)))
			return errorResult('regex parameter matches too many values, please restrict it more')
		const predicate = regex ? { matches: className } : { equals: className };
		const result = (await query(Class, { predicate })) as {
			gameVersions: GameVersion[];
		};

		const mods: ModMap = new ModMap();
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			const loaderVersion: LoaderVersion = [loader, version];
			for (const { node } of gameVersion.mods.edges) {
				const cfId = node.curseforgeProjectId ?? undefined;
				const mrId = node.modrinthProjectId ?? undefined;
				let classes = node.classes;
				// ignore anything but the primary modid
				const modid = node.modIds?.[0] ?? node.name ?? 'unknown modid';

				let extra = mods.update([cfId, mrId], loaderVersion, modid, () => ({
					modid,
					cfId,
					mrId,
					versions: [loaderVersion],
					extra: new Set(),
				}));

				classes.forEach(({ name }) => extra(name));
			}
		}

		if (mods.isEmpty()) return errorResult(`No mods found containing a class matching \`${className}\``);


		const [mrModInfo, { data: cfModInfo }] = await Promise.all([
			mrModInfos(mods.getModrinthIds()),
			cfModInfos(mods.getCurseForgeIds()),
		]);

		const mrMods: Record<string, Project> = mrModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<string, Project>,
		);
		const cfMods: Record<number, CFMod> = cfModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<number, CFMod>,
		);

		const blockedIndices = new Set();
		const index: Record<string, number> = {}
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

			const classesString = 'Classes: ' +
				first(filled.extra, 5)
					.map((e) => `\`${e.split('/').pop()}\``)
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
