import { type CommandOption, type CommandOptions, InteractionContextType } from '../lib/discord.ts';
import { Command, CommandResult, type OptionGetter } from '../lib/command.ts';

export class AnonymousCommand<O extends CommandOptions> extends Command<O> {
	private readonly exec: (env: Env, getOption: OptionGetter<O>) => Promise<CommandResult>;

	constructor(
		name: string,
		description: string,
		exec: (env: Env, getOption: OptionGetter<O>) => Promise<CommandResult>,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	) {
		super(name, description, options, contexts, true);
		this.exec = exec;
	}

	protected executeImpl(env: Env, getOption: OptionGetter<O>, id: string): Promise<CommandResult> {
		return this.exec(env, getOption);
	}
}
