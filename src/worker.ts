import { AutoRouter } from 'itty-router';
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import { COMMANDS } from './commands.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body: {type: InteractionResponseType, data?: object}, init?) {
    const jsonBody = JSON.stringify(body);
    init = init ?? {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

export default {
	/**
	 * Every request to a worker will start in the `fetch` method.
	 * Verify the signature with the request, and dispatch to the router.
	 * @param {*} request A Fetch Request object
	 * @param {*} env A map of key/value pairs with env vars and secrets from the cloudflare env.
	 * @returns
	 */
	async fetch(request, env, ctx) {
		if (request.method === 'POST') {
			// Using the incoming headers, verify this request actually came from discord.
			const signature = request.headers.get('x-signature-ed25519');
			const timestamp = request.headers.get('x-signature-timestamp');
			const body = await request.clone().arrayBuffer();

			const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
			if (!isValidRequest) {
				console.error('Invalid Request');
				return new Response('Bad request signature.', { status: 401 });
			}

			const message = await request.json();
      // console.log(message)
			if (message.type === InteractionType.PING) {
				// The `PING` message is used during the initial webhook handshake, and is
				// required to configure the webhook in the developer portal.
				return new JsonResponse({
					type: InteractionResponseType.PONG,
				});
			} else if (message.type === InteractionType.APPLICATION_COMMAND) {
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Pong"
          }
        })
      } else {
        return new Response("Unknown interaction", { status: 501 })
      }
		}
	},
};
