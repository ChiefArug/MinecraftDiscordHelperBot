import { InteractionResponseType } from 'discord-interactions';

export class JsonResponse extends Response {
	constructor(body: { type: InteractionResponseType; data?: object }, init?: ResponseInit) {
		const jsonBody = JSON.stringify(body);
		init = init ?? {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
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
