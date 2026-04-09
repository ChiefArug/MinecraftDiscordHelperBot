import { CommandOptionType, Interaction } from './discord.ts';
import { Command, PingCommand } from './command.ts';
import { PingResponse } from './response.ts';

const __commands = {
	ping: new PingCommand(),
	test: new (class extends Command {
		constructor() {
			super('test', 'Is the bot online?');
		}
		execute(_i: Interaction, _e: Env): Response {
			return new PingResponse();
		}
	})(),
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
	},
};
export declare type CommandName = keyof typeof __commands;
// @ts-ignore
export const COMMANDS = __commands as Record<CommandName, Command>;
