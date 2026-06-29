import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import {
	CommandInteraction,
	ComponentInteraction,
	ComponentType,
	Interaction,
	InteractiveComponentType,
	ModalComponentResponse,
	ModalInteraction,
	TextInputStyle,
} from './lib/discord.ts';
import { ComponentResponse, InteractionResponse, MessageResponse, ModalResponse, PingResponse } from './lib/response.ts';
import Page from './index.ts';
import { COMMANDS } from './commands.ts';
import { commandResultKey, getFromCache } from './lib/cache.ts';
import {
	CheckboxComponent,
	LabelComponent,
	SelectOption,
	StringSelectComponent,
	TextComponent,
	TextInputComponent,
} from './lib/component.ts';
import { getPage, makePaginationButtons } from './lib/pagination.ts';
import { ModInfoComponent } from './lib/extraComponents.ts';
import { checkSuccess, pairInRange } from './lib/util.ts';

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
						return await handleModal(env, ctx, message).then(response);
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
		return await command.execute(message, env, ctx);
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

			const cache = await getFromCache(commandResultKey(id));
			// todo: edit to remove buttons?
			if (cache === undefined) return new MessageResponse('Message cache expired');
			const { index, modInfos } = cache;
			if (typeof index !== 'object' || !Array.isArray(modInfos)) return new MessageResponse('Message cache corrupted');
			const components = modInfos.map((mi, i) => new ModInfoComponent(mi, i));

			const collected = getPage(components, page);

			if (collected.length === 0) return new MessageResponse('Invalid page number');
			// TODO: the middle button should open a modal to select page, or collapse to a single entry and remove pagination.
			return new ComponentResponse(
				[...collected, makePaginationButtons(commandName, id, page, maxPage, collected[0].id ?? 0)],
				InteractionResponseType.UPDATE_MESSAGE,
			);
		}
		case '—': {
			// 'home' (this is an em-dash).
			const [_, commandName, id, stringFirstComponent, maxPages] = parts;
			const firstComponent = Number(stringFirstComponent);

			const fromCache = await getFromCache(commandResultKey(id));
			if (fromCache === undefined) return new MessageResponse('Message cache expired');

			const { index, modInfos } = fromCache;
			console.log(typeof index, typeof modInfos);
			if (typeof index !== 'object' || !Array.isArray(modInfos)) return new MessageResponse('Message cache corrupted');
			const options: SelectOption[] = modInfos.map((m, i) => [m, i] as const).slice(...pairInRange(firstComponent, modInfos.length, 0, 12)).map(
				([mod, i]) =>
					new SelectOption(
						mod.displayName === undefined
							? mod.modid // limited to 64 chars by modloaders
							: mod.displayName.length + mod.modid.length + 3 < 100
								? `${mod.displayName} (${mod.modid})` // fits under length so show both
								: mod.displayName.length > 100
									? mod.displayName.slice(0, 99) + '…' // slice very long display name (cf supports up to 256 chars)
									: mod.displayName,
						String(i),
					),
			);

			return new ModalResponse('A Modal!', `m-${id}-${message.message.id}`, [
				new TextComponent(
					'Choose a mod to collapse the embed to, or delete the message\n\nMods can be identified by most information provided by the bot, such as index, modid, curseforge link, modrinth link or github link.\n-# Note if any of these are not unique between mods then you cannot select a mod through it.',
				),
				new LabelComponent('Choose a mod', new StringSelectComponent(options, 'choose', 'Choose a mod', false)),
				new LabelComponent('Or identify the mod', new TextInputComponent(TextInputStyle.SHORT, 'identifier', '', '', false)),
				new LabelComponent('Or tick the box to delete the message instead', new CheckboxComponent('del')),
			]);
		}
		default:
			return new MessageResponse('Unknown button');
	}
}

async function handleModal(env: Env, ctx: ExecutionContext<any>, message: ModalInteraction): Promise<InteractionResponse> {
	const parts = message.data.custom_id.split('-');
	if (parts.length < 3) return new MessageResponse("Bad modal!")
	if (parts[0] !== 'm') return new MessageResponse('Unrecognised modal')
	const id = parts[1];
	const messageId = parts[2];
	const components = message.data.components.map(c => c.type === ComponentType.LABEL ? c.component : c).reduce(
		(p, c) => c.custom_id !== undefined ? Object.assign(p, { [c.custom_id]: c }) : p,
		{} as Record<string, ModalComponentResponse>,
	);

	const { choose, identifier, del } = components;
	if (choose?.type !== ComponentType.STRING_SELECT || identifier?.type !== ComponentType.TEXT_INPUT || del?.type !== ComponentType.CHECKBOX) return new MessageResponse('Invalid modal data?');

	const cache = await getFromCache(commandResultKey(id));
	if (cache === undefined) return new MessageResponse('Message cache expired');
	const { index, modInfos } = cache;

	const chosen = choose.values;
	const identified = identifier.value?.trim();
	const deleted = del.value;

	if (chosen.length > 0) {
		const mod = Number(chosen[0]);
		return new ComponentResponse([new ModInfoComponent(modInfos[mod])], InteractionResponseType.UPDATE_MESSAGE);
	} else if (identified !== '') {
		//TODO: in text input, normalise links before lookup
		let ind = index[identified]
		if (ind === undefined) {
			ind = Number(identified);
			if (isNaN(ind) || !(ind < modInfos.length)) return new MessageResponse('Unknown identifier!')
		}
		const cached = modInfos[ind];
		if (cached === undefined) return new MessageResponse('Invalid identifier!')
		return new ComponentResponse([new ModInfoComponent(cached)], InteractionResponseType.UPDATE_MESSAGE);
	} else if (deleted) {
		ctx.waitUntil(fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${message.token}/messages/${messageId}`, {method: 'DELETE'}).then(checkSuccess('discord-delete')));
		return new MessageResponse("Message deleted");
	}
	return new MessageResponse('No options selected.');
}
