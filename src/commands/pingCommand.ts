import { Command, errorResult, type OptionGetter, CommandResult } from '../lib/command.ts';

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>, id: string): Promise<CommandResult> {
		return Promise.resolve(errorResult('Pong!'));
	}
}
