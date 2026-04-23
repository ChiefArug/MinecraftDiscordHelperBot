import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import { type AckNow, Command, type OptionGetter } from '../lib/command.ts';

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>, _a: AckNow): Promise<InteractionResponse> {
		return Promise.resolve(new MessageResponse('Pong!'));
	}
}
