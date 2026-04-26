import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import { Command, type OptionGetter } from '../lib/command.ts';

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>): Promise<InteractionResponse> {
		return Promise.resolve(new MessageResponse('Pong!'));
	}
}
