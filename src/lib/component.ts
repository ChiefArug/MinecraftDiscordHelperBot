import { ButtonStyle, ComponentType, type PartialEmoji, type UnfurledMedia } from './discord.ts';

/** The maximum number of components in a message */
export const MAX_COMPONENTS = 40;

export abstract class Component {
	readonly type: ComponentType;
	readonly id?: number;

	protected constructor(type: ComponentType, id?: number) {
		this.type = type;
		this.id = id;
	}

	/** @returns the number of components this count for. At least 1, may be more if it has child components */
	public count(): number {
		return 1;
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

	public constructor(label: string, style: Exclude<ButtonStyle, typeof ButtonStyle.LINK>, custom_id: string, emoji?: PartialEmoji, disabled?: boolean, ) {
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

	count(): number {
		return super.count() + this.components.map((c) => c.count()).reduce((a, b) => a + b, 0) + this.accessory.count();
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

	count(): number {
		// button components have count 1, so we don't need to do more than this
		return super.count() + this.components.length;
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

	count(): number {
		return super.count() + this.components.map(c => c.count()).reduce((a, b) => a + b, 0);
	}
}

export type StringSelectComponent = never;
export type UserSelectComponent = never;
export type RoleSelectComponent = never;
export type MentionableSelectComponent = never;
export type ChannelSelectComponent = never;
export type FileComponent = never;
export type MediaGalleryComponent = never;
