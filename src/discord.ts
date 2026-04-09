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

export type CommandOption = {
	type: CommandOptionType;
	name: string;
	description: string;
	required?: boolean;
	choices?: (string | number)[];
	min_value?: number;
	max_value?: number;
	min_length?: number;
	max_length?: number;
	autocomplete?: boolean;
};

export type CommandOptionData = {
	name: string;
	type: CommandOptionType;
	focused?: boolean;
} & (
	| {
			type: typeof CommandOptionType.BOOLEAN;
			value: boolean;
	  }
	| {
			type: typeof CommandOptionType.INTEGER | typeof CommandOptionType.NUMBER;
			value: number;
	  }
	| {
			type: typeof CommandOptionType.STRING;
			value: string;
	  }
);

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

export type Interaction = {
	id: Snowflake;
	application_id: Snowflake;
	type: InteractionType;
	token: string;
	message: Message;
} & (
	| { type: InteractionType.PING }
	| {
			type: InteractionType.APPLICATION_COMMAND;
			data: {
				id: Snowflake;
				name: CommandName;
				type: CommandType;
				options: CommandOptionData[];
				resolved?: ResolvedData;
			};
	  }
	| {
			type: InteractionType.MODAL_SUBMIT;
			data: {
				custom_id: string;
				components: ComponentResponse[];
				resolved?: ResolvedData;
			};
	  }
);
