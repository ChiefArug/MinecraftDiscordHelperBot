import { InteractionResponseType } from 'discord-interactions';

export abstract class InteractionResponse {
	body: { type: InteractionResponseType; data?: object };
	headers: Record<string, string>;

	protected constructor(body: { type: InteractionResponseType; data?: object }) {
		this.body = body;
		this.headers = {
			'content-type': 'application/json;charset=UTF-8',
		};
	}

	response() {
		return new Response(JSON.stringify(this.body), { headers: this.headers });
	}

	request(target: URL, method: 'POST' | 'PATCH' = 'POST' ): Request {
		if (target.pathname.endsWith('callback') || target.pathname.endsWith('callback/')) throw new Error('Cannot send InteractionResponse as request to callback endpoint!')
			return new Request(target, { method: method, body: JSON.stringify(this.body.data), headers: this.headers });
	}
}

export class AckResponse extends InteractionResponse {
	constructor() {
		super({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
	}
}

export class MessageResponse extends InteractionResponse {
	constructor(message: string) {
		super(
			{
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: message,
				},
			}
		);
	}
}

export class PingResponse extends InteractionResponse {
	constructor() {
		super({ type: InteractionResponseType.PONG });
	}
}
