import {
	type CommandInteraction,
	type CommandOption,
	type CommandOptionData,
	CommandOptionType,
	InteractionContextType,
} from './discord.ts';
import { AckResponse, InteractionResponse, MessageResponse, PingResponse } from './response.ts';
import { query } from './waifu.ts';

export type AckNow = (extra: () => Promise<InteractionResponse>) => InteractionResponse;

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
/**
 * A class representing a Discord command
 */
export abstract class Command<O extends Record<string, CommandOptionType>> {
	readonly name: string;
	readonly description: string;
	readonly contexts: InteractionContextType[];
	readonly options: CommandOption<O>[];

	protected static readonly ALL_INTERACTIONS = [
		InteractionContextType.GUILD,
		InteractionContextType.BOT_DM,
		InteractionContextType.PRIVATE_CHANNEL,
	];

	constructor(name: string, description: [O] extends [never] ? string : never, options?: Record<string, never>);
	constructor(
		name: string,
		description: string,
		options: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	);
	constructor(
		name: string,
		description: string,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts: InteractionContextType[] = Command.ALL_INTERACTIONS,
	) {
		this.name = name;
		this.description = description;
		this.options = Object.values(options ?? {});
		this.contexts = contexts;
	}

	protected getOption(int: CommandInteraction<O>, name: keyof O & string): CommandOptionData<O> | undefined {
		const optionData = int.data.options.find((o) => o.name === name);
		if (optionData) return optionData;
		const option = this.options.find((o) => o.name === name);
		// programmer error, should never happen tho due to the typing system
		if (!option) throw new Error(`Option ${name} does not exist in command ${name}!`);
		// the user didn't supply it
		return undefined;
	}

	/**
	 * Handle this command being executed.
	 * @param interaction The interaction parsed from Discord
	 * @param env Environment Variables
	 * @param ack Helper function to immediately respond with an ack and then send a proper response later
	 * @example
	 * return new MessageResponse("Pong!");
	 * @example
	 * return ack(async () => {
	 *   const result = await someFunctionThatTakesALongTime(interaction.thing);
	 *   return new MessageResponse(result + " = 42");
	 * };
	 * @protected
	 */
	protected abstract executeImpl(interaction: CommandInteraction<O>, env: Env, ack: AckNow): Promise<InteractionResponse>;

	/**
	 * Execute this command from the provided interaction information and environment variables
	 * @param int The interaction parsed from Discord
	 * @param env Environment variables
	 */
	execute(int: CommandInteraction<O>, env: Env): Promise<InteractionResponse> {
		return this.executeImpl(int, env, (extra: () => Promise<InteractionResponse>) => {
			const url = new URL(`https://discord.com/api/v10/interactions/${int.id}/${int.token}/callback`);
			extra().then(
				(res) => fetch(res.request(url)),
				(err) => {
					console.error(`Error responding to request ${int.id}: ${err}`);
					return fetch(new MessageResponse(`An error occurred executing that. Id for logging: ${int.id}`).request(url));
				},
			);
			return new AckResponse();
		});
	}
}

export class PingCommand extends Command<never> {
	constructor() {
		super('ping', 'Check if the bot is online');
	}

	executeImpl(_i: CommandInteraction<never>, _e: Env, _a: AckNow): Promise<InteractionResponse> {
		return Promise.resolve(new PingResponse());
	}
}

type QueryOptions = { query: typeof CommandOptionType.STRING };
export class QueryCommand extends Command<QueryOptions> {
	constructor() {
		super(
			'query',
			'Run the provided query against WAIFU',
			{
				query: {
					name: 'query',
					type: CommandOptionType.STRING,
					description: 'The query to execute',
					min_length: 20,
					max_length: 2000,
				},
			},
			Command.ALL_INTERACTIONS,
		);
	}

	protected async executeImpl(interaction: CommandInteraction<QueryOptions>, env: Env, ack: AckNow): Promise<InteractionResponse> {
		const q = this.getOption(interaction, 'query');
		if (!q) return new MessageResponse('Query was null!');
		const queryResult = await query(q.value);
		//TODO: respond with file if too large
		return new MessageResponse(`\`\`\`json\n${JSON.stringify(queryResult, null, 1)}\`\`\``);
	}
}
