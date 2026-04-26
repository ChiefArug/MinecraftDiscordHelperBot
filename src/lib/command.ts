import { type CommandInteraction, type CommandOption, type CommandOptions, CommandOptionType, type CommandOptionTypeT, InteractionContextType } from './discord.ts';

import { AckResponse, InteractionResponse, MessageResponse } from './response.ts';
export type OptionKey<O extends CommandOptions> = keyof O & string;

type __defaultedOptionGetter<O extends CommandOptions> = <K extends OptionKey<O>, D extends CommandOptionTypeT[O[K]] | undefined>(
	option: K,
	defaultValue: D,
) => CommandOptionTypeT[O[K]] | D;
type __nullableOptionGetter<O extends CommandOptions> = <K extends OptionKey<O>>(
	option: K,
) => CommandOptionTypeT[O[K]] | undefined

export type OptionGetter<O extends CommandOptions> = __defaultedOptionGetter<O> & __nullableOptionGetter<O>;

export type StringArg<K extends string> = { [k in K]: typeof CommandOptionType.STRING };
export type BoolArg<K extends string> = { [k in K]: typeof CommandOptionType.BOOLEAN };

/**
 * A class representing a Discord command
 */
export abstract class Command<O extends CommandOptions> {
	readonly name: string;
	readonly description: string;
	readonly contexts: InteractionContextType[];
	//TODO: replace CommandOption type with a class that maps name -> property and overrides toJSON() to provide the list form for discord
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

	/**
	 * Handle this command being executed.
	 * @param env Environment Variables
	 * @param getOption Helper function to get an option
	 * @example
	 * return new MessageResponse("Pong!");
	 * @protected
	 */
	protected abstract executeImpl(env: Env, getOption: OptionGetter<O>): Promise<InteractionResponse>;

	/**
	 * Execute this command from the provided interaction information and environment variables
	 * @param int The interaction parsed from Discord
	 * @param env Environment variables
	 * @param ctx Context of the request
	 */
	execute(int: CommandInteraction<O>, env: Env, ctx: ExecutionContext<any>): Promise<InteractionResponse> {
		const optionGetter: OptionGetter<O> = getOptionGetter(this.options, int);

		const base = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${int.token}`;
		// this block executes the command, then tries to gracefully deal with any errors.
		// it is not awaited, instead it is passed to CF to finish after the response is returned, and will time out after 30s.
		ctx.waitUntil(this.executeImpl(env, optionGetter)
			// first stage, basic response. both success and errors edit the original message
			.then((response) => {
				return fetch(response.request(new URL(base + '/messages/@original'), 'PATCH'));
			}, (err) => {
				console.error(`Error responding to request ${int.id}: ${err}, ${err.stack}`);
				return fetch(
					new MessageResponse(`An error occurred executing that. Id for logging: ${int.id}`).request(
						new URL(base + '/messages/@original'),
						'PATCH',
					),
				);
			})
			// second stage, more error handling. will send a new message rather than try edit the original response
			.then((res) => {
				if (res.status !== 200) {
					return Promise.all([
						res.text().then(txt => console.error(`Failed to respond to ${int.id}: ${res.status}, ${txt}`)),
						fetch(new MessageResponse(`An error occurred responding to that request :(. Id for logging: ${int.id}`)
								.request(new URL(base), 'POST'),
						)]);
				}
			}).catch((err) => {
				console.error(`Really failed to respond to request! ${int.id}, ${err}, ${err.stack}`);
			})
		);

		//immediately return an ack response
		return Promise.resolve(new AckResponse());
	}
}

type OptionType<O extends CommandOptions, K extends OptionKey<O>> = CommandOptionTypeT[O[K]]

function getOptionGetter<O extends CommandOptions>(options: CommandOption<O>[], int: CommandInteraction<O>): OptionGetter<O> {

	function getOption<K extends OptionKey<O>, D extends OptionType<O, K> | undefined>(name: K, def?: D): OptionType<O, K> | D;
	function getOption<K extends OptionKey<O>, D extends OptionType<O, K> | undefined>(name: K, def?: D): OptionType<O, K> | D | undefined {
		const optionData = int.data.options.find((o) => o.name === name);

		if (optionData) return optionData.value;
		const option = options.find((o) => o.name === name);

		// programmer error, should never happen tho due to the typing system
		if (!option) throw new Error(`Option ${name} does not exist in command ${name}!`);

		return def;
	}

	return getOption;
}
