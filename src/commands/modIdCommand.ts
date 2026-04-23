import { CommandOptionType } from '../lib/discord.ts';
import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import type { GameVersion, Loader } from '../graphql/graphql.ts';
import { type AckNow, Command, type OptionGetter, BoolArg, type StringArg } from '../lib/command.ts';
import { query } from '../waifu.ts';

// language=GraphQL
const ModId = `query ModId($predicate: StringPredicate) {
    gameVersions {
        version
        loader
        mods(where: {modId: $predicate}, first: 2) {
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
			},
			regex: {
				name: 'regex',
				type: CommandOptionType.BOOLEAN,
				description: 'If the query should use regex',
				required: false,
			},
		});
	}
	protected async executeImpl(env: Env, getOption: OptionGetter<Args>, ack: AckNow): Promise<InteractionResponse> {
		const regex = getOption('regex', false);
		const modid = getOption('modid');
		if (!modid) return new MessageResponse('modid parameter is required!');

		const predicate = regex ? { matches: modid } : { equals: modid};

		const result = (await query(ModId, { predicate })) as { gameVersions: GameVersion[] };
		const cfMods: Record<number, `[${string}] ${Loader} ${string}`[]> = {};
		const mrMods: Record<string, `[${string}] ${Loader} ${string}`[]> = {};
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			for (const { node } of gameVersion.mods.edges) {
				const cf = node.curseforgeProjectId;
				const mr = node.modrinthProjectId;
				const modids = node.modIds as string[];
				if (cf) (cfMods[cf] ??= []).push(`[${modids}] ${loader} ${version}`);
				if (mr) (mrMods[mr] ??= []).push(`[${modids}] ${loader} ${version}`);
			}
		}
		if (Object.keys(cfMods).length === 0 && Object.keys(mrMods).length === 0)
			return new MessageResponse(`No mods found with modid ${modid}`);

		const wrap = <T extends string | number>(prefix: string, values: Record<T, `[${string}] ${Loader} ${string}`[]>): string => {
			return Object.entries(values)
				.map(([id, versionString]) => {
					return `${prefix}${id} ${versionString}`;
				})
				.join('\n');
		};
		return new MessageResponse(
			`Mods found: \nModrinth: ${wrap('https://modrinth.com/mod/', mrMods)}\nCurseForge: ${wrap('https://cflookup.com/', cfMods)}`,
		);
	}
}
