import { type CommandOption, type CommandOptions, InteractionContextType } from '../lib/discord.ts';
import { Command, type OptionGetter } from '../lib/command.ts';
import { Component } from '../lib/component.ts';

export class AnonymousCommand<O extends CommandOptions> extends Command<O> {
	private readonly exec: (env: Env, getOption: OptionGetter<O>) => Promise<Component[]>;

	constructor(
		name: string,
		description: string,
		exec: (env: Env, getOption: OptionGetter<O>) => Promise<Component[]>,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	) {
		super(name, description, options, contexts, true);
		this.exec = exec;
	}

	protected executeImpl(env: Env, getOption: OptionGetter<O>, id: string): Promise<Component[]> {
		return this.exec(env, getOption);
	}
}
