import {
	type CommandInteraction,
	type CommandOption,
	type CommandOptionData,
	type CommandOptions,
	CommandOptionType,
	type Interaction,
	InteractionContextType,
} from './discord.ts';

import { AckResponse, InteractionResponse, MessageResponse } from './response.ts';

export type AckNow = (extra: () => Promise<InteractionResponse>) => InteractionResponse;
export type OptionKey<O extends CommandOptions> = keyof O & string;
export type OptionGetter<O extends CommandOptions> = (option: OptionKey<O>) => CommandOptionData<O> | undefined;
export type SimpleString<K extends string> = { [k in K]: typeof CommandOptionType.STRING };

/**
 * A class representing a Discord command
 */
export abstract class Command<O extends CommandOptions> {
	readonly name: string;
	readonly description: string;
	readonly contexts: InteractionContextType[];
	readonly options: CommandOption<O>[];

	protected static readonly ALL_INTERACTIONS = [
		InteractionContextType.GUILD,
		InteractionContextType.BOT_DM,
		InteractionContextType.PRIVATE_CHANNEL,
	];

	protected constructor(name: string, description: [O] extends [never] ? string : never, options?: Record<string, never>);
	protected constructor(
		name: string,
		description: string,
		options: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	);
	protected constructor(
		name: string,
		description: string,
		options: { [K in keyof O & string]: CommandOption<O, K> } | undefined,
		contexts: InteractionContextType[] | undefined,
		iAmASuperClassThatIsDynamicallyPassingOptions: true,
	);
	protected constructor(
		name: string,
		description: string,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts: InteractionContextType[] = Command.ALL_INTERACTIONS,
		iAmASuperClassThatIsDynamicallyPassingOptions: boolean = false,
	) {
		this.name = name;
		this.description = description;
		this.options = Object.values(options ?? {});
		this.contexts = contexts;
		// noinspection BadExpressionStatementJS
		iAmASuperClassThatIsDynamicallyPassingOptions;
	}

	private getOption(int: CommandInteraction<O>, name: OptionKey<O>): CommandOptionData<O> | undefined {
		const optionData = int.data.options.find((o) => o.name === name);
		if (optionData) return optionData;
		const option = this.options.find((o) => o.name === name);
		// programmer error, should never happen tho due to the typing system
		if (!option) throw new Error(`Option ${name} does not exist in command ${name}!`);
		return undefined;
	}

	private respondEventually(response: Promise<InteractionResponse>, int: Interaction): void {
		const url = new URL(`https://discord.com/api/v10/interactions/${int.id}/${int.token}/callback`);
		response.then(
			(res) => fetch(res.request(url)),
			(err) => {
				console.error(`Error responding to request ${int.id}: ${err}`);
				return fetch(new MessageResponse(`An error occurred executing that. Id for logging: ${int.id}`).request(url));
			},
		);
	}

	/**
	 * Handle this command being executed.
	 * @param env Environment Variables
	 * @param getOption Helper function to get an option
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
	protected abstract executeImpl(env: Env, getOption: OptionGetter<O>, ack: AckNow): Promise<InteractionResponse>;

	/**
	 * Execute this command from the provided interaction information and environment variables
	 * @param int The interaction parsed from Discord
	 * @param env Environment variables
	 */
	execute(int: CommandInteraction<O>, env: Env): Promise<InteractionResponse> {
		return this.executeImpl(
			env,
			(option: OptionKey<O>) => this.getOption(int, option),
			(extra: () => Promise<InteractionResponse>) => {
				this.respondEventually(extra(), int);
				return new AckResponse();
			},
		);
	}
}
