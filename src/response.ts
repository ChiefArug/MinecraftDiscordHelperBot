import { InteractionResponseType } from 'discord-interactions';

export abstract class InteractionResponse {
	body: string;
	headers: Record<string, string>;

	protected constructor(body: string, headers: Record<string, string>) {
		this.body = body;
		this.headers = headers;
	}

	response() {
		return new Response(this.body, { headers: this.headers });
	}

	request(target: URL): Request {
		return new Request(target, { body: this.body, headers: this.headers });
	}
}

export class JsonResponse extends InteractionResponse {
	constructor(body: { type: InteractionResponseType; data?: object }, init?: ResponseInit) {
		const jsonBody = JSON.stringify(body);
		const headers = {
			'content-type': 'application/json;charset=UTF-8',
		};
		super(jsonBody, headers);
	}
}

export class AckResponse extends JsonResponse {
	constructor() {
		super({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
	}
}

export class MessageResponse extends JsonResponse {
	constructor(message: string, init?: ResponseInit) {
		super(
			{
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: message,
				},
			},
			init,
		);
	}
}

export class PingResponse extends JsonResponse {
	constructor() {
		super({ type: InteractionResponseType.PONG });
	}
}
