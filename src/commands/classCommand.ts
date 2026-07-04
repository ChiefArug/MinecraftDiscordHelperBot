import { CommandOptionType } from '../lib/discord.ts';
import type { Mod } from '../graphql/graphql.ts';
import type { BoolArg, OptionGetter, StringArg } from '../lib/command.ts';
import { first, isRegexSafe } from '../lib/util.ts';
import type { FilledModInfo } from '../lib/modInfo.ts';
import { SearchCommand } from '../lib/searchCommand.ts';

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
export class ClassCommand extends SearchCommand<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			class: {
				name: 'class',
				type: CommandOptionType.STRING,
				description: 'The classname to search for',
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
		return Class;
	}

	protected parseOptions(getOption: OptionGetter<Args>): string | Record<string, any> {
		let className = getOption('class');
		if (!className) return 'class parameter is required!';

		let regex = getOption('regex', false);

		// . is ambiguous, could mean / or $. check for both
		// because we turn it into a regex we do some replacements as well.
		if (!regex && className.includes('.')) {
			regex = true;
			className = `^${className.replaceAll('$', '\\$').replaceAll('.', '[/$]')}$`;
		}
		if (regex && (className.startsWith('$') || (className.endsWith('^') && (!className.endsWith("\\^") || className.endsWith("\\\\^")))))
			return 'malformed regex! $ marks the end of a string (not the front) and ^ marks the front of a string (not the end)'
		if (regex && !isRegexSafe(new RegExp(className)))
			return 'regex parameter matches too many values, please restrict it more';
		const predicate = regex ? { matches: className } : { equals: className };
		return { predicate }
	}

	protected attachExtras(node: Mod, addExtra: (extra: string) => void): void {
		node.classes.forEach(({ name }) => addExtra(name))
	}

	protected processExtras(mod: FilledModInfo): string {
		return 	'Classes: ' +
			first(mod.extra, 5)
				.map((e) => `\`${e.split('/').pop()}\``)
				.join(', ') +
			(mod.extra.size > 5 ? ` and ${mod.extra.size - 5} more` : '');
	}
}
