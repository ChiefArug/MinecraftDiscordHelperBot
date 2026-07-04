import { CommandOptionType } from '../lib/discord.ts';
import type { Mod } from '../graphql/graphql.ts';
import type { BoolArg, OptionGetter, StringArg } from '../lib/command.ts';
import type { FilledModInfo } from '../lib/modInfo.ts';
import { first } from '../lib/util.ts';
import { SearchCommand } from '../lib/searchCommand.ts';

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

export class ModIdCommand extends SearchCommand<Args> {
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

	protected getQuery(): string {
		return ModId;
	}

	protected parseOptions(getOption: OptionGetter<Args>): string | Record<string, any> {
		const regex = getOption('regex', false);
		const modid = getOption('modid');
		if (!modid) return 'modid parameter is required!';

		return { predicate: regex ? { matches: modid } : { equals: modid } };
	}

	protected attachExtras(node: Mod, addExtra: (extra: string) => void): void {
		const modIds = node.modIds ?? undefined;
		if (modIds !== undefined && modIds.length > 0) modIds.slice(1).forEach(addExtra);
	}

	protected processExtras(mod: FilledModInfo): string {
		return mod.extra.size == 0
			? ''
			: 'Other ModIds: ' +
					first(mod.extra, 8)
						.map((e) => `\`${e.split('/').pop()}\``)
						.join(', ') +
					(mod.extra.size > 8 ? ` and ${mod.extra.size - 8} more` : '');
	}
}
