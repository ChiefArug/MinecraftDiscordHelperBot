import {
	type CommandInteraction,
	type CommandOption,
	type CommandOptionData,
	CommandOptions,
	CommandOptionType,
	Interaction,
	InteractionContextType,
} from './discord.ts';
import { AckResponse, InteractionResponse, MessageResponse, PingResponse } from './response.ts';
import { query } from './waifu.ts';
import { JIJ, ModId } from './queries.ts';
import { GameVersion, Loader } from './graphql/graphql.ts';
import { clampInside } from './lib.ts';

export type AckNow = (extra: () => Promise<InteractionResponse>) => InteractionResponse;
export type OptionGetter<O extends CommandOptions> = (option: string) => CommandOptionData<O> | undefined;

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
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

	private getOption(int: CommandInteraction<O>, name: keyof O & string): CommandOptionData<O> | undefined {
		const optionData = int.data.options.find((o) => o.name === name);
		if (optionData) return optionData;
		const option = this.options.find((o) => o.name === name);
		// programmer error, should never happen tho due to the typing system
		if (!option) throw new Error(`Option ${name} does not exist in command ${name}!`);
		return undefined
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
			(option: string) => this.getOption(int, option),
			(extra: () => Promise<InteractionResponse>) => {
				this.respondEventually(extra(), int);
				return new AckResponse();
			},
		);
	}
}

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>, _a: AckNow): Promise<InteractionResponse> {
		return Promise.resolve(new PingResponse());
	}
}
type SimpleString<K extends string> = { [k in K]: typeof CommandOptionType.STRING };

export class QueryCommand extends Command<SimpleString<'query'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			query: {
				name: 'query',
				type: CommandOptionType.STRING,
				description: 'The query to execute',
				min_length: 20,
				max_length: 2000,
			},
		});
	}

	protected async executeImpl(_e: Env, getOption: OptionGetter<SimpleString<'query'>>, _a: AckNow): Promise<InteractionResponse> {
		const q = getOption('query');
		if (!q) return new MessageResponse('Query was null!');
		const queryResult = await query(q.value);
		//TODO: respond with file if too large
		return new MessageResponse(`\`\`\`json\n${JSON.stringify(queryResult, null, 1)}\`\`\``);
	}
}

export class ModIdCommand extends Command<SimpleString<'modid'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			modid: {
				name: 'modid',
				type: CommandOptionType.STRING,
				description: 'Mod ID to search for',
				min_length: 2,
				max_length: 64,
			},
		});
	}
	protected async executeImpl(env: Env, getOption: OptionGetter<SimpleString<'modid'>>, ack: AckNow): Promise<InteractionResponse> {
		const modid = getOption('modid');
		if (!modid) return new MessageResponse('modid parameter is required!');
		const result = (await query(ModId, { modid: modid.value })) as { gameVersions: GameVersion[] };
		const cfMods: Record<number, `[${string}] ${Loader} ${string}`[]> = {};
		const mrMods: Record<string, `[${string}] ${Loader} ${string}`[]> = {};
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
			return new MessageResponse(`No mods found with modid ${modid}`);

		const wrap = <T extends string | number>(prefix: string, values: Record<T, `[${string}] ${Loader} ${string}`[]>): string => {
			return Object.entries(values)
				.map(([id, versionString]) => {
					return `${prefix}${id} ${versionString}`;
				})
				.join('\n');
		};
		return new MessageResponse(
			`Mods found: \nModrinth: ${wrap('https://modrinth.com/mod/', mrMods)}\nCurseForge: ${wrap('https://cflookup.com/', cfMods)}`,
		);
	}
}

export class JijCommand extends Command<SimpleString<'query'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			query: {
				name: 'query',
				type: CommandOptionType.STRING,
				description: 'A substring of what you want to search for, ie mixinextras-neoforge',
				min_length: 3,
				max_length: 64,
			},
		});
	}
	protected async executeImpl(env: Env, getOption: OptionGetter<SimpleString<'query'>>, ack: AckNow): Promise<InteractionResponse> {
		const queryTerm = getOption('query');
		if (!queryTerm) return new MessageResponse('query parameter is required!');
		const result = (await query(JIJ, { term: queryTerm.value })) as { gameVersions: GameVersion[] };
		return new MessageResponse(clampInside('```json\n', '```', JSON.stringify(result, null, 1), 2000));
	}
}

export class AnonymousCommand<O extends CommandOptions> extends Command<O> {
	private readonly exec: (env: Env, getOption: OptionGetter<O>, ack: AckNow) => Promise<InteractionResponse>;

	constructor(
		name: string,
		description: string,
		exec: (env: Env, getOption: OptionGetter<O>, ack: AckNow) => Promise<InteractionResponse>,
		options?: { [K in keyof O & string]: CommandOption<O, K> },
		contexts?: InteractionContextType[],
	) {
		super(name, description, options, contexts, true);
		this.exec = exec;
	}

	protected executeImpl(env: Env, getOption: OptionGetter<O>, ack: AckNow): Promise<InteractionResponse> {
		return this.exec(env, getOption, ack);
	}
}
