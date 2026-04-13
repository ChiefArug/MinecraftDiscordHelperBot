import { InteractionType } from 'discord-interactions';
import type { CommandName } from './commands.ts';

export const CommandOptionType = {
	SUB_COMMAND: 1,
	SUB_COMMAND_GROUP: 2,
	STRING: 3,
	/** Any integer between -2^53+1 and 2^53-1 */
	INTEGER: 4,
	BOOLEAN: 5,
	USER: 6,
	/** Includes all channel types + categories */
	CHANNEL: 7,
	ROLE: 8,
	/** Includes users and roles */
	MENTIONABLE: 9,
	/** Any double between -2^53 and 2^53 */
	NUMBER: 10,
	/** attachment object */
	ATTACHMENT: 11,
} as const;
export type CommandOptionType = (typeof CommandOptionType)[keyof typeof CommandOptionType];
export type CommandOptionTypeT = {
	[CommandOptionType.SUB_COMMAND]: never;
	[CommandOptionType.SUB_COMMAND_GROUP]: never;
	[CommandOptionType.STRING]: string;
	[CommandOptionType.INTEGER]: number;
	[CommandOptionType.BOOLEAN]: boolean;
	[CommandOptionType.USER]: never;
	[CommandOptionType.CHANNEL]: never;
	[CommandOptionType.ROLE]: never;
	[CommandOptionType.MENTIONABLE]: never;
	[CommandOptionType.NUMBER]: number;
	[CommandOptionType.ATTACHMENT]: never;
};
export type CommandOptionTypes = CommandOptionTypeT[keyof CommandOptionTypeT]

export type NumberCommandOption = {
	type: typeof CommandOptionType.NUMBER | typeof CommandOptionType.INTEGER;
	choices?: number[];
	min_value?: number;
	max_value?: number;
};
export type StringCommandOption = {
	type: typeof CommandOptionType.STRING;
	min_length?: number;
	max_length?: number;
}
type __commandOption<NAME extends string, T extends CommandOptionType> = {
	name: NAME;
	type: T;
	description: string;
	required?: boolean;
	autocomplete?: boolean;
} & (NumberCommandOption | StringCommandOption);
export type CommandOption<O extends Record<string, CommandOptionType>, N extends string = keyof O & string> = __commandOption<N, O[N]>;


type __commandOptionData<N extends string, T extends CommandOptionType> = {
	name: N;
	type: T;
	value: CommandOptionTypeT[T];
	focused?: boolean;
};
export type CommandOptionData<O extends Record<string, CommandOptionType>, N extends string = keyof O & string> = __commandOptionData<N, O[N]>;

export const InteractionContextType = {
	GUILD: 0,
	BOT_DM: 1,
	PRIVATE_CHANNEL: 2,
} as const;
export type InteractionContextType = (typeof InteractionContextType)[keyof typeof InteractionContextType]

export type Snowflake = `${bigint}`;

// some wip types
export type Message = never;
export type ComponentResponse = never;
export type ResolvedData = never;

export const CommandType = {
	/** Slash commands; a text-based command that shows up when a user types */
	CHAT_INPUT: 1,
	/** A UI-based command that shows up when you right click or tap on a user */
	USER: 2,
	/** A UI-based command that shows up when you right click or tap on a message */
	MESSAGE: 3,
	/** A UI-based command that represents the primary way to invoke an app’s Activity */
	PRIMARY_ENTRY_POINT: 4,
};
export type CommandType = (typeof CommandType)[keyof typeof CommandType];

type BaseInteraction = {
	id: Snowflake;
	application_id: Snowflake;
	type: InteractionType;
	token: string;
	message: Message;
};

export type PingInteraction = { type: InteractionType.PING } & BaseInteraction;
export type CommandInteraction<O extends Record<string, CommandOptionType>> = {
	type: InteractionType.APPLICATION_COMMAND;
	data: {
		id: Snowflake;
		name: CommandName;
		type: CommandType;
		options: CommandOptionData<O, any>[];
		resolved?: ResolvedData;
	};
} & BaseInteraction;
export type ModalInteraction = {
	type: InteractionType.MODAL_SUBMIT;
	data: {
		custom_id: string;
		components: ComponentResponse[];
		resolved?: ResolvedData;
	};
} & BaseInteraction;
export type Interaction = PingInteraction | CommandInteraction<any> | ModalInteraction;
