import { CommandOptionType } from '../lib/discord.ts';
import type { Mod } from '../graphql/graphql.ts';
import { type BoolArg, errorResult, type OptionGetter, type StringArg } from '../lib/command.ts';
import { first, regexEscape } from '../lib/util.ts';
import type { FilledModInfo } from '../lib/modInfo.ts';
import { SearchCommand } from '../lib/searchCommand.ts';

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

type Args = StringArg<'locator'> & BoolArg<'regex'>
export class JijCommand extends SearchCommand<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			locator: {
				name: 'locator',
				type: CommandOptionType.STRING,
				description: 'A substring of the (maven) location you want to search for, ie mixinextras-neoforge',
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

	protected getQuery(): string {
		return JIJ;
	}

	protected parseOptions(getOption: OptionGetter<Args>): string | Record<string, any> {
		const locator = getOption('locator');
		if (!locator) return errorResult('locator parameter is required!');

		const regex = getOption('regex', false);

		const pattern = regex ? locator : regexEscape(locator);
		return { predicate: { matches: pattern } }
	}

	protected attachExtras(node: Mod, addExtra: (extra: string) => void): void {
		if (node.nestedArtifactsFlat === undefined || node.nestedArtifactsFlat === null) return;
		node.nestedArtifactsFlat.forEach(nested => addExtra(`\`${nested.id}\` (${nested.version})`));
	}

	protected processExtras(mod: FilledModInfo): string {
		return mod.extra.size == 0
			? ''
			: 'JiJs: ' + first(mod.extra, 5).join(', ') + (mod.extra.size > 5 ? ` and ${mod.extra.size - 5} more` : '');
	}
}
