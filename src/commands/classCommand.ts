import { CommandOptionType } from '../lib/discord.ts';
import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import { query } from '../waifu.ts';
import type { GameVersion, Loader } from '../graphql/graphql.ts';
import { type BoolArg, Command, type OptionGetter, type StringArg } from '../lib/command.ts';

// language=GraphQL
export const JIJ = `query JIJ($predicate: StringPredicate) {
	gameVersions {
		version
		loader
		mods(where: {anyClass: {name: $predicate}} first: 10) {
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

export class ClassCommand extends Command<StringArg<'class'> & BoolArg<'regex'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			class: {
				name: 'class',
				type: CommandOptionType.STRING,
				description: 'The classname to search for, in JVM format (ie java/lang/Character$Subset)',
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
		getOption: OptionGetter<StringArg<'class'> & BoolArg<'regex'>>,
	): Promise<InteractionResponse> {
		const className = getOption('class');
		if (!className) return new MessageResponse('class parameter is required!');

		const regex = getOption('regex', false);

		if (!regex && className.includes('.')) return new MessageResponse('class parameter needs to be in JVM format, not java format! Use `/` instead of `.` for package separation, and `$` instead of `.` for inner class separation.');
		// The method works both locally and on workers, it's just not recognised.
		// @ts-expect-error
		const pattern = regex ? className : RegExp.escape(className);
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
				let classes = node.classes;
				const classCount = classes?.length ?? -1;
				const modids = node.modIds as string[];
				const matchingClasses = classes
					.slice(0, 1)
					.map((na) => `\`${na.name.split('/').slice(-1)}\``)
					.join(',');
				const modidsDisplay = modids.map((m) => `\`${m}\``).join(',');
				if (cf)
					(cfMods[cf] ??= []).push(`[${modidsDisplay}] ${loader} ${version} Found: ${classCount}. First: ${matchingClasses}`);
				if (mr)
					(mrMods[mr] ??= []).push(`[${modidsDisplay}] ${loader} ${version} Found: ${classCount}. First: ${matchingClasses}`);
			}
		}

		if (Object.keys(cfMods).length === 0 && Object.keys(mrMods).length === 0)
			return new MessageResponse(`No mods found containing a class matching ${className}`);

		const wrap = <T extends string | number>(prefix: string, values: Record<T, `[${string}] ${Loader} ${string}`[]>): string => {
			return Object.entries(values)
				.map(([id, versionString]) => {
					return `${prefix}${id} ${versionString}`;
				})
				.join('\n');
		};

		let message = `Mods found: \nModrinth: ${wrap('https://modrinth.com/mod/', mrMods)}\nCurseForge: ${wrap('https://cflookup.com/', cfMods)}`;
		console.log(message);
		return new MessageResponse(
			message,
		);
	}
}
