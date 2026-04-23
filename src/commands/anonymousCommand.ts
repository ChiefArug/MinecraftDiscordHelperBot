import { type CommandOption, type CommandOptions, InteractionContextType } from '../lib/discord.ts';
import { InteractionResponse } from '../lib/response.ts';
import { type AckNow, Command, type OptionGetter } from '../lib/command.ts';

export class AnonymousCommand<O extends CommandOptions> extends Command<O> {
	private readonly exec: (env: Env, getOption: OptionGetter<O>, ack: AckNow) => Promise<InteractionResponse>;

	constructor(
		name: string,
		description: string,
		exec: (env: Env, getOption: OptionGetter<O>, ack: AckNow) => Promise<InteractionResponse>,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	) {
		super(name, description, options, contexts, true);
		this.exec = exec;
	}

	protected executeImpl(env: Env, getOption: OptionGetter<O>, ack: AckNow): Promise<InteractionResponse> {
		return this.exec(env, getOption, ack);
	}
}
