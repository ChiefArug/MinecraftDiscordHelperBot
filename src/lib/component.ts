import { ButtonStyle, ComponentType, type PartialEmoji, TextInputStyle, type UnfurledMedia } from './discord.ts';

/** The maximum number of components in a message */
export const MAX_COMPONENTS = 40;

/**
 * Count the number of components nested inside a component (including the component itself).
 * @param component
 */
export const countComponents = (component: Component): number => {
	switch (component.type) {
		case ComponentType.SECTION:
			return (component as SectionComponent).components.length + 2;
		case ComponentType.CONTAINER:
			return (component as ContainerComponent).components.map((c) => countComponents(c)).reduce((a, b) => a + b, 0) + 1;
		case ComponentType.ACTION_ROW:
			return (component as ActionRowComponent).components.length + 1;
		default:
			return 1;
	}
}

/**
 * A component for Discord's Components V2 system.
 * IMPORTANT: DO NOT ADD ANY FUNCTIONS TO THIS OR RELY ON INSTANCEOF WORKING.
 * This class is used as a duck type, so objects with the same fields are valid for it.
 */
export abstract class Component {
	readonly type: ComponentType;
	readonly id?: number;

	protected constructor(type: ComponentType, id?: number) {
		this.type = type;
		this.id = id;
	}
}

export abstract class ButtonComponent extends Component {
	readonly label?: string;
	readonly style: ButtonStyle;
	readonly emoji?: PartialEmoji;
	readonly disabled?: boolean;

	protected constructor(label: string, style: ButtonStyle, emoji?: PartialEmoji, disabled?: boolean, id?: number) {
		super(ComponentType.BUTTON, id);
		this.label = label;
		this.style = style;
		this.emoji = emoji;
		this.disabled = disabled;
	}
}

export class ActionButtonComponent extends ButtonComponent {
	readonly custom_id?: string;

	public constructor(label: string, style: Exclude<ButtonStyle, typeof ButtonStyle.LINK>, custom_id: string, disabled?: boolean, emoji?: PartialEmoji, ) {
		super(label, style, emoji, disabled);
		this.custom_id = custom_id;
	}
}

export class LinkButtonComponent extends ButtonComponent {
	readonly url: string;

	public constructor(url: string, label: string, emoji?: PartialEmoji, disabled?: boolean) {
		super(label, ButtonStyle.LINK, emoji, disabled);
		this.url = url;
	}
}


type SectionChildComponents = TextComponent;
type SectionAccessoryComponent = ButtonComponent | ThumbnailComponent;
type SectionComponentList =
	| [SectionChildComponents]
	| [SectionChildComponents, SectionChildComponents]
	| [SectionChildComponents, SectionChildComponents, SectionChildComponents];

export class SectionComponent extends Component {
	readonly components: SectionComponentList;
	readonly accessory: SectionAccessoryComponent;

	public constructor(components: SectionComponentList, accessory: SectionAccessoryComponent, id?: number) {
		super(ComponentType.SECTION, id);
		this.components = components;
		this.accessory = accessory;
	}
}

export class TextComponent extends Component {
	declare readonly type: typeof ComponentType.TEXT_DISPLAY;
	readonly content: string;

	public constructor(content: string, id?: number) {
		super(ComponentType.TEXT_DISPLAY, id);
		this.content = content;
	}
}

type ActionRowComponentList =
	| [ButtonComponent]
	| [ButtonComponent, ButtonComponent]
	| [ButtonComponent, ButtonComponent, ButtonComponent]
	| [ButtonComponent, ButtonComponent, ButtonComponent, ButtonComponent]
	| [ButtonComponent, ButtonComponent, ButtonComponent, ButtonComponent, ButtonComponent];
export class ActionRowComponent extends Component {
	readonly components: ActionRowComponentList;

	public constructor(components: ActionRowComponentList, id?: number) {
		super(ComponentType.ACTION_ROW, id);
		this.components = components;
	}
}

export class ThumbnailComponent extends Component {
	readonly media: UnfurledMedia;
	readonly description?: string;
	readonly spoiler?: boolean;

	public constructor(media_url: string, description?: string, spoiler?: boolean, id?: number) {
		super(ComponentType.THUMBNAIL, id);
		this.media = { url: media_url};
		this.description = description;
		this.spoiler = spoiler;
	}
}

export class SeparatorComponent extends Component {
	readonly divider?: boolean;
	readonly spacing?: 1 | 2;

	public constructor(spacing?: 1 | 2, divider?: boolean, id?: number) {
		super(ComponentType.SEPARATOR, id);
		this.divider = divider;
		this.spacing = spacing;
	}
}

type ContainerChildComponent =
	| ActionRowComponent
	| TextComponent
	| SectionComponent
	| SeparatorComponent;
export class ContainerComponent extends Component {
	readonly components: ContainerChildComponent[];
	readonly accent_color?: number;
	readonly spoiler?: boolean;

	public constructor(components: ContainerChildComponent[], accent_color?: number, spoiler?: boolean, id?: number) {
		super(ComponentType.CONTAINER, id);
		this.components = components;
		this.accent_color = accent_color;
		this.spoiler = spoiler;
	}
}

export class SelectOption {
	readonly label: string;
	readonly value: string;
	readonly description?: string;
	readonly emoji?: PartialEmoji;
	readonly default?: boolean;

	constructor(label: string, value: string, description?: string, emoji?: PartialEmoji, default_?: boolean) {
		this.label = label;
		this.value = value;
		this.description = description;
		this.emoji = emoji;
		this.default = default_;
	}
}

export class StringSelectComponent extends Component {
	readonly custom_id: string;
	readonly options: SelectOption[];
	readonly placeholder?: string;
	readonly required?: boolean;
	readonly min_values?: number;
	readonly max_values?: number;

	constructor(options: SelectOption[], custom_id: string, placeholder?: string, required?: boolean, min_values?: number, max_values?: number, id?: number) {
		super(ComponentType.STRING_SELECT, id);
		this.custom_id = custom_id;
		this.options = options;
		this.placeholder = placeholder;
		this.required = required;
		this.min_values = min_values;
		this.max_values = max_values;
	}
}

export class TextInputComponent extends Component {
	readonly custom_id: string;
	readonly style: TextInputStyle;
	readonly value?: string;
	readonly placeholder?: string;
	readonly required?: boolean;
	readonly min_length?: number;
	readonly max_length?: number;

	public constructor(
		style: TextInputStyle,
		custom_id: string,
		value?: string,
		placeholder?: string,
		required?: boolean,
		min_length?: number,
		max_length?: number,
		id?: number,
	) {
		super(ComponentType.TEXT_INPUT, id);
		this.style = style;
		this.custom_id = custom_id;
		this.value = value;
		this.placeholder = placeholder;
		this.required = required;
		this.min_length = min_length;
		this.max_length = max_length;
	}
}
export type UserSelectComponent = never;
export type RoleSelectComponent = never;
export type MentionableSelectComponent = never;
export type ChannelSelectComponent = never;
export type FileComponent = never;
export type MediaGalleryComponent = never;

type LabelChildComponent = TextInputComponent | StringSelectComponent | UserSelectComponent | RoleSelectComponent | MentionableSelectComponent | ChannelSelectComponent | FileUploadComponent | RadioGroupComponent | CheckboxGroupComponent | CheckboxComponent;
export class LabelComponent extends Component {
	readonly label: string;
	readonly description?: string;
	readonly component: LabelChildComponent;

	constructor(label: string, component: LabelChildComponent, description?: string, id?: number) {
		super(ComponentType.LABEL, id);
		this.label = label;
		this.description = description;
		this.component = component;
	}
}

export type FileUploadComponent = never;
export type RadioGroupComponent = never;
export type CheckboxGroupComponent = never;
export type CheckboxComponent = never;
