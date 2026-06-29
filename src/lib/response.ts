import { InteractionResponseType } from 'discord-interactions';
import {
	ActionRowComponent,
	ButtonComponent,
	ChannelSelectComponent,
	CheckboxComponent,
	CheckboxGroupComponent,
	ContainerComponent,
	FileComponent,
	FileUploadComponent,
	LabelComponent,
	MediaGalleryComponent,
	MentionableSelectComponent,
	RadioGroupComponent,
	RoleSelectComponent,
	SectionComponent,
	SeparatorComponent,
	StringSelectComponent,
	TextComponent,
	TextInputComponent,
	ThumbnailComponent,
	UserSelectComponent,
} from './component.ts';

export abstract class InteractionResponse {
	body: { type: InteractionResponseType; data?: object };
	headers: Record<string, string>;

	protected constructor(body: { type: InteractionResponseType; data?: object }) {
		this.body = body;
		this.headers = {
			'content-type': 'application/json;charset=UTF-8',
		};
	}

	response() {
		return new Response(JSON.stringify(this.body), { headers: this.headers });
	}

	request(target: URL, method: 'POST' | 'PATCH' = 'POST'): Request {
		if (target.pathname.endsWith('callback') || target.pathname.endsWith('callback/'))
			throw new Error('Cannot send InteractionResponse as request to callback endpoint!');
		return new Request(target, { method: method, body: JSON.stringify(this.body.data), headers: this.headers });
	}
}

export class AckResponse extends InteractionResponse {
	constructor() {
		super({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
	}
}

export class AckEditResponse extends InteractionResponse {
	constructor() {
		super({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
	}
}

export class MessageResponse extends InteractionResponse {
	constructor(message: string, ephemeral: boolean = true) {
		super({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: message,
				flags: ephemeral ? 1 << 6 : 0
			},
		});
	}
}

type MessageComponents = ActionRowComponent | ButtonComponent | StringSelectComponent | UserSelectComponent | RoleSelectComponent | MentionableSelectComponent | ChannelSelectComponent | SectionComponent | TextComponent | ThumbnailComponent | MediaGalleryComponent | FileComponent | SeparatorComponent | ContainerComponent;
export class ComponentResponse extends InteractionResponse {
	constructor(components: MessageComponents[], type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE | InteractionResponseType.UPDATE_MESSAGE = InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE) {
		super({
			type: type,
			data: {
				flags: 1 << 15,
				components: components,
			},
		});
	}
}

export class PingResponse extends InteractionResponse {
	constructor() {
		super({ type: InteractionResponseType.PONG });
	}
}

type ModalComponents = StringSelectComponent | TextInputComponent | UserSelectComponent | RoleSelectComponent | MentionableSelectComponent | ChannelSelectComponent | TextComponent | LabelComponent | FileUploadComponent | RadioGroupComponent | CheckboxGroupComponent | CheckboxComponent;
type ModalComponentList = [ModalComponents] | [ModalComponents, ModalComponents] | [ModalComponents, ModalComponents, ModalComponents] | [ModalComponents, ModalComponents, ModalComponents, ModalComponents] | [ModalComponents, ModalComponents, ModalComponents, ModalComponents, ModalComponents];
export class ModalResponse extends InteractionResponse {
	constructor(title: string, custom_id: string, components: ModalComponentList) {
		super({
			type: InteractionResponseType.MODAL,
			data: {
				title,
				custom_id,
				components,
			},
		});
	}
}
