import { InteractionResponse, PingResponse } from '../lib/response.ts';
import { AckNow, Command, OptionGetter } from '../lib/command.ts';

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>, _a: AckNow): Promise<InteractionResponse> {
		return Promise.resolve(new PingResponse());
	}
}
