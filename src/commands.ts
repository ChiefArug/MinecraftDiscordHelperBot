import { CommandOptionType, InteractionContextType } from './discord.ts';
import { Command, PingCommand } from './command.ts';


/*
COMMANDS TO ADD
Search by package substring
Search by method usage
Search

 */
const __commands = {
	ping: new PingCommand(),
	// test: new (class extends Command {
	// 	async executeImpl(_i: CommandInteraction, _e: Env, _a: AckNow): Promise<InteractionResponse> {
	// 		return new PingResponse();
	// 	}
	// })('test', 'A test command. Who knows what it could do?', undefined, undefined),
	modid: {
		description: 'Look up information about a particular Mod ID',
		options: [
			{
				type: CommandOptionType.STRING,
				name: 'modid',
				description: 'Mod ID to search for',
				min_length: 2,
				max_length: 64,
			},
		],
		contexts: [InteractionContextType.GUILD, InteractionContextType.BOT_DM, InteractionContextType.PRIVATE_CHANNEL],
	},
	query: {
		description: 'Run the query passed in as a string',
		options: [
			{
				type: CommandOptionType.STRING,
				name: 'query',
				description: 'The query',
				min_length: 7,
			},
		],
		contexts: [InteractionContextType.GUILD, InteractionContextType.BOT_DM, InteractionContextType.PRIVATE_CHANNEL],
	},
	jij: {
		description: 'Search for a mod or library being jar-in-jarred',
		options: [
			{
				type: CommandOptionType.STRING,
				name: 'query',
				description: 'A substring of what you want to search for, ie mixinextras-neoforge',
				min_length: 3,
				max_length: 64,
			},
		],
		contexts: [InteractionContextType.GUILD, InteractionContextType.BOT_DM, InteractionContextType.PRIVATE_CHANNEL],
	},
};
export declare type CommandName = keyof typeof __commands;
// @ts-ignore
export const COMMANDS = __commands as Record<CommandName, Command>;
