import { Command, type CommandResult, errorResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { Labrinth } from '@modrinth/api-client';
import type { GameVersion } from '../graphql/graphql.ts';
import { fillModInfo, ModMap } from '../lib/modInfo.ts';
import { first, type ListEntries, type LoaderVersion, max, optionalIndex } from '../lib/util.ts';
import { mrModInfos } from '../modrinth.ts';
import { cfModInfos } from '../curseforge.ts';
import type { CFMod } from '../lib/cfTypes.ts';

type Project = Labrinth.Projects.v2.Project;

// language=GraphQL
const FieldUsages = `query FieldUsages($class: String!, $field: String!, $loader: Loader!, $version: String!) {
	gameVersion (loader: $loader, version: $version) {
		loader
		version
		class (name: $class) {
			fields (where: {name: {equals: $field}}) {
				type
				references (where: {referenceCount: {greaterThan: 0}}) {
					owner {
						name
						mod {
							name
							curseforgeProjectId
							modrinthProjectId
							modIds
						}
					}
				}
			}
		}
	}
}
`;

const Loaders = ['Fabric', 'Forge', 'NeoForge'] as const;
type Args = StringArg<'class'> & StringArg<'field'> & StringArg<'version'> & StringArg<'modloader'>;
export class FieldUsageCommand extends Command<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			class: {
				name: 'class',
				type: CommandOptionType.STRING,
				description: 'Event to search for as a fully qualified class name in JVM format.',
				min_length: 4,
				max_length: 128,
				required: true,
			},
			field: {
				name: 'field',
				type: CommandOptionType.STRING,
				description: 'Field to search for',
				min_length: 1,
				max_length: 128,
				required: true,
			},
			version: {
				name: 'version',
				type: CommandOptionType.STRING,
				description: 'The version of Minecraft to search',
				required: true,
			},
			modloader: {
				name: 'modloader',
				type: CommandOptionType.STRING,
				description: 'The modloader to search',
				options: ['Fabric', 'Forge', 'NeoForge'],
				required: true,
			},
		});
	}

	protected async executeImpl(env: Env, getOption: OptionGetter<Args>, id: string): Promise<CommandResult> {
		const clazz = getOption('class');
		const field = getOption('field');
		const versionArg = getOption('version');
		const loaderArg = getOption('modloader') as ListEntries<typeof Loaders> | undefined;
		if (!clazz || !field || !versionArg || !loaderArg) return errorResult('class, field, version and modloader parameters are required!');
		if (!Loaders.includes(loaderArg)) return errorResult('Unknown loader `' + loaderArg + '`. Try one of: `' + Loaders.join('`,`') + '`');

		const result = await query<{
			gameVersion: GameVersion;
		}>(FieldUsages, { class: clazz, field: field, loader: loaderArg, version: versionArg });
		
		if (typeof result === 'string') return errorResult(result);

		const mods: ModMap = new ModMap();
		const { loader, version } = result.gameVersion;
		const loaderVersion: LoaderVersion = [loader, version];
		let foundClass = result.gameVersion.class;
		if (foundClass === undefined || foundClass === null) return errorResult('Class not found');

		let fields = foundClass.fields;
		if (fields.length === 0) return errorResult('Class field found');
		if (fields.length > 1) console.warn(`Multiple fields found for ${clazz}.${field} of types ${fields.map(f => f.type).join(', ')}`);

		const fieldReferences = (fields.length === 1 ? fields[0] : max(fields, f => f.references.length)).references;

		for (const { owner } of fieldReferences) {
			const className = owner.name;
			const mod = owner.mod;
			const cfId = mod.curseforgeProjectId ?? undefined;
			const mrId = mod.modrinthProjectId ?? undefined;
			// ignore anything but the primary modid
			const modIds: string[] | undefined = mod.modIds ?? undefined;
			const modid = modIds?.[0] ?? mod.name ?? 'unknown modid';

			let extra = mods.update([cfId, mrId], loaderVersion, modid, () => ({
				modid,
				cfId,
				mrId,
				versions: new Set([loaderVersion]),
				extra: new Set(),
			}));

			extra(className);
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

			const extraString =
				filled.extra.size == 0
					? ''
					: 'Classes: ' + first(filled.extra, 5).join(', ') + (filled.extra.size > 5 ? ` and ${filled.extra.size - 5} more` : '');
			return Object.assign(filled, {
				versions: [...filled.versions],
				extra: extraString,
			});
		});

		return { modInfos, index };
	}
}
