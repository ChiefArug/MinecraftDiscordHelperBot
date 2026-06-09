import { ButtonStyle, ComponentType, type PartialEmoji, type UnfurledMedia } from './discord.ts';

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

export type StringSelectComponent = never;
export type UserSelectComponent = never;
export type RoleSelectComponent = never;
export type MentionableSelectComponent = never;
export type ChannelSelectComponent = never;
export type FileComponent = never;
export type MediaGalleryComponent = never;
