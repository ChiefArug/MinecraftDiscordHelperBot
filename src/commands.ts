import { Command } from './lib/command.ts';
import { ComponentResponse } from './lib/response.ts';
import { ModIdCommand } from './commands/modIdCommand.ts';
import { AnonymousCommand } from './commands/anonymousCommand.ts';
import { JijCommand } from './commands/jijCommand.ts';
import { QueryCommand } from './commands/queryCommand.ts';
import { PingCommand } from './commands/pingCommand.ts';
import { ClassCommand } from './commands/classCommand.ts';
import { test } from './modrinth.ts';
import { ButtonStyle, ComponentType } from './lib/discord.ts';


/*
COMMANDS TO ADD
Search by package substring
Search by method usage
Search

 */

const __commands = {
	ping: new PingCommand('ping', 'Check if the bot is online'),
	test: new AnonymousCommand('test', 'A test command. Who knows what it could do?', async (_i, _e) => {
		const res = await test() as {projects: number, versions: number, files: number, authors: number};
		return new ComponentResponse([
			{
				type: ComponentType.TEXT_DISPLAY,
				content: 'Here are some modrinth stats!',
			},
			{
				type: ComponentType.CONTAINER,
				components: [
					{
						type: ComponentType.SECTION,
						components: [
							{
								type: ComponentType.TEXT_DISPLAY,
								content: 'Projects: ' + res.projects,
							},
						],
						accessory: {
							type: ComponentType.THUMBNAIL,
							description: 'modrinth logo',
							media: {
								url: 'https://cdn.modrinth.com/modrinth-new.png',
							},
						},
					},
					{
						type: ComponentType.TEXT_DISPLAY,
						content: 'Versions: ' + res.versions,
					},
					{
						type: ComponentType.TEXT_DISPLAY,
						content: 'Files: ' + res.files,
					},
					{
						type: ComponentType.SECTION,
						components: [
							{
								type: ComponentType.TEXT_DISPLAY,
								content: 'Authors: ' + res.authors,
							},
						],
						accessory: {
							type: ComponentType.BUTTON,
							style: ButtonStyle.LINK,
							label: 'Sign Up',
							emoji: {
								name: 'modrinth',
								id: '1040805511538421890',
							},
							url: 'https://modrinth.com/auth/sign-up',
						},
					},
				],
			},
		]);
	}),
	modid: new ModIdCommand('modid', 'Look up information about a particular Mod ID'),
	query: new QueryCommand('query', 'Run the query passed in as a string'),
	jij: new JijCommand('jij', 'Search for a mod or library being jar-in-jarred'),
	class: new ClassCommand('class', 'Search for mods containing a particular class')
} as Record<string, Command<any>>;

export declare type CommandName = keyof typeof __commands;
export const COMMANDS = __commands as Record<CommandName, Command<any>>;
