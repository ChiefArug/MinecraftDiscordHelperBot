import { CommandOptionType } from '../lib/discord.ts';
import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import { query } from '../waifu.ts';
import type { GameVersion } from '../graphql/graphql.ts';
import { clampInside } from '../lib/util.ts';
import { AckNow, Command, OptionGetter, SimpleString } from '../lib/command.ts';

// language=GraphQL
export const JIJ = `query JIJ($term: String) {
	gameVersions {
		version
		loader
		mods(where: {anyNestedArtifact: {id: {matches: $term}}} first: 10) {
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

export class JijCommand extends Command<SimpleString<'query'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			query: {
				name: 'query',
				type: CommandOptionType.STRING,
				description: 'A substring of what you want to search for, ie mixinextras-neoforge',
				min_length: 3,
				max_length: 64,
			},
		});
	}
	protected async executeImpl(env: Env, getOption: OptionGetter<SimpleString<'query'>>, ack: AckNow): Promise<InteractionResponse> {
		const queryTerm = getOption('query');
		if (!queryTerm) return new MessageResponse('query parameter is required!');
		const result = (await query(JIJ, { term: queryTerm.value })) as { gameVersions: GameVersion[] };
		return new MessageResponse(clampInside('```json\n', '```', JSON.stringify(result, null, 1), 2000));
	}
}
