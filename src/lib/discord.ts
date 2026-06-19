import { InteractionType } from 'discord-interactions';
import type { CommandName } from '../commands.ts';

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
	options?: string[]
}
export type BooleanCommandOption = { type: typeof CommandOptionType.BOOLEAN; }
type __commandOption<NAME extends string, T extends CommandOptionType> = {
	name: NAME;
	type: T;
	description: string;
	required?: boolean;
	autocomplete?: boolean;
} & (NumberCommandOption | StringCommandOption | BooleanCommandOption);
export type CommandOptions = Record<string, CommandOptionType>;
export type CommandOption<O extends CommandOptions, N extends string = keyof O & string> = __commandOption<N, O[N]>;


type __commandOptionData<N extends string, T extends CommandOptionType> = {
	name: N;
	type: T;
	value: CommandOptionTypeT[T];
	focused?: boolean;
};
export type CommandOptionData<O extends CommandOptions, N extends string = keyof O & string> = __commandOptionData<N, O[N]>;

export const InteractionContextType = {
	GUILD: 0,
	BOT_DM: 1,
	PRIVATE_CHANNEL: 2,
} as const;
export type InteractionContextType = (typeof InteractionContextType)[keyof typeof InteractionContextType]

export type Snowflake = `${bigint}`;

// some wip types
export type Message = {
	id: string;
	channel_id: string;
};

type ComponentResponseBase<MODAL extends boolean, TYPE extends ComponentType> = {
	[Key in MODAL extends true ? 'type' : 'component_type']: TYPE;
} & {
	id: number;
	custom_id: string;
};
export type StringSelectResponse<MODAL extends boolean = false> = {
	values: string[];
} & ComponentResponseBase<MODAL, typeof ComponentType.STRING_SELECT>
export type TextInputResponse<MODAL extends boolean = false> = {
	value: string
} & ComponentResponseBase<MODAL, typeof ComponentType.TEXT_INPUT>
export type UserSelectResponse<MODAL extends boolean = false> = {
	resolved: ResolvedData;
	values: Snowflake[];
} & ComponentResponseBase<MODAL, typeof ComponentType.USER_SELECT>;
export type RoleSelectResponse<MODAL extends boolean = false> = {
	resolved: ResolvedData;
	values: Snowflake[];
} & ComponentResponseBase<MODAL, typeof ComponentType.ROLE_SELECT>;
export type MentionableSelectResponse<MODAL extends boolean = false> = {
	resolved: ResolvedData;
	values: Snowflake[];
} & ComponentResponseBase<MODAL, typeof ComponentType.MENTIONABLE_SELECT>;
export type ChannelSelectResponse<MODAL extends boolean = false> = {
	resolved: ResolvedData;
	values: Snowflake[];
} & ComponentResponseBase<MODAL, typeof ComponentType.CHANNEL_SELECT>;
export type TextDisplayResponse<MODAL extends boolean = false> = ComponentResponseBase<MODAL, typeof ComponentType.TEXT_DISPLAY>
export type LabelResponse<MODAL extends boolean = false> = {
	component: TextInputResponse | StringSelectResponse | UserSelectResponse | RoleSelectResponse | MentionableSelectResponse | ChannelSelectResponse | FileUploadResponse | RadioGroupResponse | CheckboxGroupResponse | CheckboxResponse; // technically more strict than this.
} & ComponentResponseBase<MODAL, typeof ComponentType.LABEL>
export type FileUploadResponse<MODAL extends boolean = false> = {
	value: Snowflake[];
} & ComponentResponseBase<MODAL, typeof ComponentType.FILE_UPLOAD>
export type RadioGroupResponse<MODAL extends boolean = false> = {
	value: string | null;
} & ComponentResponseBase<MODAL, typeof ComponentType.RADIO_GROUP>
export type CheckboxGroupResponse<MODAL extends boolean = false> = {
	values: string[]
} & ComponentResponseBase<MODAL, typeof ComponentType.CHECKBOX_GROUP>
export type CheckboxResponse<MODAL extends boolean = false> = {
	value: boolean;
} & ComponentResponseBase<MODAL, typeof ComponentType.CHECKBOX>
export type ComponentResponse = StringSelectResponse |
TextInputResponse |
UserSelectResponse |
RoleSelectResponse |
MentionableSelectResponse |
ChannelSelectResponse |
TextDisplayResponse |
LabelResponse |
FileUploadResponse |
RadioGroupResponse |
CheckboxGroupResponse |
CheckboxResponse;

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

export const ComponentType = {
	ACTION_ROW: 1,
	BUTTON: 2,
	STRING_SELECT: 3,
	TEXT_INPUT: 4,
	USER_SELECT: 5,
	ROLE_SELECT: 6,
	MENTIONABLE_SELECT: 7,
	CHANNEL_SELECT: 8,
	SECTION: 9,
	TEXT_DISPLAY: 10,
	THUMBNAIL: 11,
	MEDIA_GALLERY: 12,
	FILE: 13,
	SEPARATOR: 14,
	// 15
	// 16
	CONTAINER: 17,
	LABEL: 18,
	FILE_UPLOAD: 19,
	RADIO_GROUP: 20,
	CHECKBOX_GROUP: 21,
	CHECKBOX: 22,
} as const;
export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];


type BaseInteraction = {
	id: Snowflake;
	application_id: Snowflake;
	type: InteractionType;
	token: string;
	message: Message;
};

export type PingInteraction = { type: InteractionType.PING } & BaseInteraction;
export type CommandInteraction<O extends CommandOptions> = {
	type: InteractionType.APPLICATION_COMMAND;
	data: {
		id: Snowflake;
		name: CommandName;
		type: CommandType;
		options: CommandOptionData<O, any>[];
		resolved?: ResolvedData;
	};
} & BaseInteraction;


export const InteractiveComponentType = {
	BUTTON: ComponentType.BUTTON,
	STRING_SELECT: ComponentType.STRING_SELECT,
	USER_SELECT: ComponentType.USER_SELECT,
	ROLE_SELECT: ComponentType.ROLE_SELECT,
	MENTIONABLE_SELECT: ComponentType.MENTIONABLE_SELECT,
	CHANNEL_SELECT: ComponentType.CHANNEL_SELECT,
} as const;
export type InteractiveComponentType = (typeof InteractiveComponentType)[keyof typeof InteractiveComponentType];

export type ComponentInteraction = {
	type: InteractionType.MESSAGE_COMPONENT;
	data: {
		component_type: InteractiveComponentType;
		id: number;
		custom_id: string;
	};
} & BaseInteraction;

type ModalComponentResponse =
	| StringSelectResponse<true>
	| TextInputResponse<true>
	| UserSelectResponse<true>
	| RoleSelectResponse<true>
	| MentionableSelectResponse<true>
	| ChannelSelectResponse<true>
	| TextDisplayResponse<true>
	| LabelResponse<true>
	| FileUploadResponse<true>
	| RadioGroupResponse<true>
	| CheckboxGroupResponse<true>
	| CheckboxResponse<true>;
export type ModalInteraction = {
	type: InteractionType.MODAL_SUBMIT;
	data: {
		custom_id: string;
		components: ModalComponentResponse[];
		resolved?: ResolvedData;
	};
} & BaseInteraction;
export type Interaction = PingInteraction | CommandInteraction<any> | ModalInteraction | ComponentInteraction;

export const ButtonStyle = {
	PRIMARY: 1,
	SECONDARY: 2,
	SUCCESS: 3,
	DANGER: 4,
	LINK: 5,
} as const;
export type ButtonStyle = (typeof CommandOptionType)[keyof typeof CommandOptionType];

export const TextInputStyle = {
	SHORT: 1,
	PARAGRAPH: 2,
} as const;
export type TextInputStyle = (typeof  TextInputStyle)[keyof typeof TextInputStyle];

export type PartialEmoji = {
	name: string;
	id: string;
	animated?: boolean;
}

export type UnfurledMedia = {
	url: string;
}
