import { Command } from './lib/command.ts';
import { PingResponse } from './lib/response.ts';
import { ModIdCommand } from './commands/modIdCommand.ts';
import { AnonymousCommand } from './commands/anonymousCommand.ts';
import { JijCommand } from './commands/jijCommand.ts';
import { QueryCommand } from './commands/queryCommand.ts';
import { PingCommand } from './commands/pingCommand.ts';


/*
COMMANDS TO ADD
Search by package substring
Search by method usage
Search

 */

const __commands = {
	ping: new PingCommand('ping', 'Check if the bot is online'),
	test: new AnonymousCommand('test', 'A test command. Who knows what it could do?', (_i, _e, _a) => Promise.resolve(new PingResponse())),
	modid: new ModIdCommand('modid', 'Look up information about a particular Mod ID'),
	query: new QueryCommand('query', 'Run the query passed in as a string'),
	jij: new JijCommand('jij', 'Search for a mod or library being jar-in-jarred'),
} as Record<string, Command<any>>;

export declare type CommandName = keyof typeof __commands;
export const COMMANDS = __commands as Record<CommandName, Command<any>>;
