import { Command, CommandResult, basicTextResult, OptionGetter, StringArg } from '../lib/command.ts';
import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { GameVersion, Loader } from '../graphql/graphql.ts';
import { ListEntries, regexEscape } from '../lib/util.ts';
import { Component } from '../lib/component.ts';

// language=GraphQL
const MethodDescriptors = `query MethodDescriptors($event: String!, $loader: Loader!, $version: String!) {
  gameVersion(loader: $loader, version: $version) {
    classDefinitions (where: {anyMethod:  {
       descriptor:  {
          matches: $event
       }
    }}) {
      edges {
        node {
          name
          mod {
            name
						curseforgeProjectId
						modrinthProjectId
						modIds
          }
          methods (where:  {
             descriptor:  {
                matches: $event
             }
          }) {
            name
          }
        }
      }
    }
  }
}

`;

const Loaders = ['Fabric', 'Forge', 'NeoForge'] as const;
type Args = StringArg<'event'> & StringArg<'version'> & StringArg<'modloader'>;
export class EventCommand extends Command<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			event: {
				name: 'event',
				type: CommandOptionType.STRING,
				description: 'Event to search for',
				min_length: 4,
				max_length: 64,
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
		const event = getOption('event');
		const version = getOption('version');
		const loader = getOption('modloader') as ListEntries<typeof Loaders> | undefined;
		if (!event || !version || !loader) return basicTextResult('event, version and modloader parameters are required!');
		if (!(loader in Loaders)) return basicTextResult('Unknown loader ' + loader + '. Try one of: ' + Loaders);

		const predicate = `\\(${regexEscape(event)}\\)V`;

		const result = (await query(MethodDescriptors, { event: predicate, version, loader })) as { gameVersion: GameVersion };
		const cfMods: Record<number, `[${string}] ${Loader} ${string}`[]> = {};
		const mrMods: Record<string, `[${string}] ${Loader} ${string}`[]> = {};
		const { gameVersion } = result;

		const components: Component[] = [];
		//TODO: finish
		for (const { node } of gameVersion.classDefinitions.edges) {
			const cf = node.mod.curseforgeProjectId;
			const mr = node.mod.modrinthProjectId;
			const modids = node.mod.modIds as string[];
			if (cf) (cfMods[cf] ??= []).push(`[${modids}] ${loader} ${version}`);
			if (mr) (mrMods[mr] ??= []).push(`[${modids}] ${loader} ${version}`);
		}

		return {components};
	}
}
