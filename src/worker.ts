import { InteractionType, verifyKey } from 'discord-interactions';
import { Interaction } from './lib/discord.ts';
import { MessageResponse, PingResponse } from './lib/response.ts';
import Page from './index.ts';
import { COMMANDS } from './commands.ts';

// TODO: REFACTOR COMMAND DELEGATION SYSTEM. Maybe genrify it so you just give it query and list of params?
// TODO: Respond initially with a defer or message then send a response later on to avoid the 3 second limit which has started to be hit

export default {
	/**
	 * Every request to a worker will start in the `fetch` method.
	 * Verify the signature with the request, and dispatch to the router.
	 * @param {*} request A Fetch Request object
	 * @param {*} env A map of key/value pairs with env vars and secrets from the cloudflare env.
	 * @param ctx Context
	 * @returns
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext<any>): Promise<Response> {
		switch (request.method) {
			case 'GET': {
				const url = new URL(request.url);
				if (url.pathname === '/') return new Response(Page, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
				else return new Response(null, { status: 301, headers: { location: '/' } });
			}
			case 'POST': {
				// Using the incoming headers, verify this request actually came from discord.
				const signature = request.headers.get('x-signature-ed25519');
				const timestamp = request.headers.get('x-signature-timestamp');
				if (!signature || !timestamp) return new Response('Missing signature headers', { status: 400 });

				const body = await request.clone().arrayBuffer();

				const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
				if (!isValidRequest) {
					console.error('Invalid Request');
					return new Response('Bad request signature.', { status: 401 });
				}

				const message = (await request.json()) as Interaction;
				// console.log(message);
				switch (message.type) {
					case InteractionType.PING: {
						// The `PING` message is used during the initial webhook handshake, and is
						// required to configure the webhook in the developer portal.
						return new PingResponse().response();
					}
					case InteractionType.APPLICATION_COMMAND: {
						const { name } = message.data;
						const command = COMMANDS[name];
						console.log(command);

						if (command) {
							return (await command.execute(message, env, ctx)).response();
						} else {
							console.warn(`Unknown command ${name}`);
							return new MessageResponse('Command not implemented yet!').response();
						}
					}
					default: {
						console.warn(`Unknown interaction type ${message.type}`);
						return new Response('Unknown interaction type', { status: 501 });
					}
				}
			}
		}
		return new Response('Unknown method. Try GET or POST', { status: 400 });
	},
};
