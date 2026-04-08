import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import { COMMANDS } from './commands.js';
import { Interaction } from './discord.ts';
import { query } from './waifu.ts';
import { JIJ, MixinExtrasForgeOnNeoForge, ModId } from './queries.ts';
import { GameVersion, Loader, Mod } from './graphql/graphql.ts';
import { clampInside } from './lib.ts';

class JsonResponse extends Response {
	constructor(body: { type: InteractionResponseType; data?: object }, init?: ResponseInit) {
		const jsonBody = JSON.stringify(body);
		init = init ?? {
			headers: {
				'content-type': 'application/json;charset=UTF-8'
			}
		};
		super(jsonBody, init);
	}
}

class MessageResponse extends JsonResponse {
	constructor(message: string, init?: ResponseInit) {
		super(
			{
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: message
				}
			},
			init
		);
	}
}

class PingResponse extends JsonResponse {
	constructor() {
		super({ type: InteractionResponseType.PONG });
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
	async fetch(request: Request, env: Env) {
		if (request.method === 'POST') {
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

			const message = await request.json() as Interaction;
			// console.log(message)
			if (message.type === InteractionType.PING) {
				// The `PING` message is used during the initial webhook handshake, and is
				// required to configure the webhook in the developer portal.
				return new PingResponse();
			} else if (message.type === InteractionType.APPLICATION_COMMAND) {
				const command = message.data.name;
				switch (command) {
					case 'ping': {
						return new MessageResponse('Pong');
					}
					case 'query': {
						const q = message.data.options.find(o => o.name == 'query')?.value;
						if (q == null)
							return new MessageResponse('Query was null!');
						const queryResult = await query(q as string);
						return new MessageResponse(`\`\`\`json\n${JSON.stringify(queryResult, null, 1)}\`\`\``);
					}
					case 'test': {
						const result = await query(MixinExtrasForgeOnNeoForge);
						return new MessageResponse(`Test command works: \`\`\`json\n${JSON.stringify(result, null, 1)}\`\`\``);
					}
					case 'modid': {
						const modid = message.data.options?.find(o => o.name == 'modid')?.value as string;
						if (!modid) return new MessageResponse("modid parameter is required!");
						const result = await query(ModId, { 'modid': modid }) as {gameVersions: GameVersion[]};
						const cfMods: Record<number, `[${string}] ${Loader} ${string}`[]> = {}
						const mrMods: Record<string, `[${string}] ${Loader} ${string}`[]> = {}
						for (const gameVersion of result.gameVersions) {
							const { loader, version } = gameVersion;
							for (const { node } of gameVersion.mods.edges) {
								const cf = node.curseforgeProjectId;
								const mr = node.modrinthProjectId;
								const modids = node.modIds as string[];
								if (cf) (cfMods[cf] ??= []).push(`[${modids}] ${loader} ${version}`);
								if (mr) (mrMods[mr] ??= []).push(`[${modids}] ${loader} ${version}`);
							}
						}
						if (Object.keys(cfMods).length === 0 && Object.keys(mrMods).length === 0)
							return new MessageResponse(`No mods found with modid ${modid}`)

						const wrap = <T extends (string | number)>(prefix: string, values: Record<T, `[${string}] ${Loader} ${string}`[]>): string => {
							return Object.entries(values).map(([id, versionString]) => {
								return `${prefix}${id} ${versionString}`;
							}).join('\n');
						}
						return new MessageResponse(`Mods found: \nModrinth: ${wrap('https://modrinth.com/mod/',mrMods)}\nCurseForge: ${wrap('https://cflookup.com/', cfMods)}`);
					}
					case 'jij': {
						const queryTerm = message.data.options?.find(o => o.name == 'query')?.value as string;
						if (!queryTerm) return new MessageResponse("query parameter is required!")
						const result = await query(JIJ, { term: queryTerm }) as {gameVersions: GameVersion[]};
						return new MessageResponse(clampInside('```json\n', '```', JSON.stringify(result, null, 1), 2000));
					}
				}

				return new MessageResponse('Command not implemented yet!');
			}
			console.log(message);
			return new Response('Unknown interaction', { status: 501 });
		}
	}
};
