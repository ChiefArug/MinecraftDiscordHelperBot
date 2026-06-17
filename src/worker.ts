import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import {
	CommandInteraction,
	ComponentInteraction,
	Interaction,
	InteractiveComponentType,
	ModalInteraction,
} from './lib/discord.ts';
import { ComponentResponse, InteractionResponse, MessageResponse, ModalResponse, PingResponse } from './lib/response.ts';
import Page from './index.ts';
import { COMMANDS } from './commands.ts';
import { getFromCache } from './lib/cache.ts';
import { TextComponent } from './lib/component.ts';
import { getPage, makePaginationButtons } from './lib/pagination.ts';
import { CommandResult } from './lib/command.ts';

// TODO: REFACTOR COMMAND DELEGATION SYSTEM. Maybe genrify it so you just give it query and list of params?
// TODO: logging framework so that i can search logs better.

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
				const response = (r: InteractionResponse) => r.response();
				switch (message.type) {
					case InteractionType.PING:
						return handlePing().response();
					case InteractionType.APPLICATION_COMMAND:
						return await handleCommand(message, env, ctx).then(response);
					case InteractionType.MESSAGE_COMPONENT:
						switch (message.data.component_type) {
							case InteractiveComponentType.BUTTON:
								return await handleButton(message).then(response);
							default:
								return new Response('Unknown component type', { status: 501 });
						}
					case InteractionType.MODAL_SUBMIT:
						return await handleModal(message).then(response);
					default:
						console.warn(`Unknown interaction type ${(message as any).type}`);
						return new Response('Unknown interaction type', { status: 501 });
				}
			}
		}
		return new Response('Unknown method. Try GET or POST', { status: 400 });
	},
};


function handlePing(): InteractionResponse {
	// The `PING` message is used during the initial webhook handshake, and is
	// required to configure the webhook in the developer portal.
	return new PingResponse();
}

async function handleCommand(message: CommandInteraction<any>, env: Env, ctx: ExecutionContext<any>): Promise<InteractionResponse> {
	const { name } = message.data;
	const command = COMMANDS[name];

	if (command) {
		return (await command.execute(message, env, ctx));
	} else {
		console.warn(`Unknown command ${name}`);
		return new MessageResponse('Command not implemented yet!');
	}
}

async function handleButton(message: ComponentInteraction): Promise<InteractionResponse> {
	const { custom_id } = message.data;

	const parts = custom_id.split('-');
	if (parts.length < 1 || parts.some((p) => p === undefined)) return new MessageResponse('Malformed button!');
	switch (parts[0]) {
		case '>':
		case '<': {
			// next/prev page
			const [mode, commandName, id, stringPage, stringMaxPage] = parts;

			const page = mode === '>' ? Number(stringPage) + 1 : Number(stringPage) - 1;
			const maxPage = Number(stringMaxPage);
			if (Number.isNaN(page) || Number.isNaN(maxPage)) return new MessageResponse('Malformed page number');

			const command = COMMANDS[commandName];
			if (!command) return new MessageResponse('Command not recognised.');

			const cache = await getFromCache<CommandResult>(`pages/${id}`);
			// todo: edit to remove buttons?
			if (cache === undefined) return new MessageResponse('Message cache expired');
			if (typeof cache.index !== 'object' || !Array.isArray(cache.components)) return new MessageResponse('Message cache corrupted');
			const { components } = cache;

			const collected = getPage(components, page);

			if (collected.length === 0) return new MessageResponse('Invalid page number');
			// TODO: the middle button should open a modal to select page, or collapse to a single entry and remove pagination.
			return new ComponentResponse(
				[...collected, makePaginationButtons(commandName, id, page, maxPage)],
				InteractionResponseType.UPDATE_MESSAGE,
			);
		}
		case '—': { // 'home' (this is an em-dash).
			const [_, commandName, id, maxPages] = parts;

			const fromCache = await getFromCache<CommandResult>(`pages/${id}`);
			if (fromCache === undefined) return new MessageResponse('Message cache expired');
			if (fromCache.index === undefined) return new MessageResponse('Message cache corrupted')

			return new ModalResponse('A Modal!', 'manage_modal', [
				new TextComponent(`\nYour index data: ${JSON.stringify(Object.values(fromCache.index))}`),
			]);
		}
		default:
			return new MessageResponse('Unknown button');
	}
}

async function handleModal(message: ModalInteraction): Promise<InteractionResponse> {
	message.data.components.forEach((component) => {
		console.log(component);
	})
	return new MessageResponse('modal submitted!');
}
