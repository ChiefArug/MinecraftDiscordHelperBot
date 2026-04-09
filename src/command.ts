import { Interaction, InteractionContextType } from './discord.ts';
import { AckResponse, PingResponse } from './response.ts';

export abstract class Command {
	name: string;
	description: string;
	integration_types: InteractionContextType[];

	private static ALL_INTEGRATIONS = [InteractionContextType.GUILD, InteractionContextType.BOT_DM, InteractionContextType.PRIVATE_CHANNEL];

	protected constructor(name: string, description: string, integration_types?: InteractionContextType[]) {
		this.name = name;
		this.description = description;
		this.integration_types = integration_types ?? Command.ALL_INTEGRATIONS;
	}

	abstract execute(interaction: Interaction, env: Env): Response;

	private static ack(): Response {
		return new AckResponse();
	}
}

export class PingCommand extends Command {
	constructor() {
		super('ping', 'Check if the bot is online');
	}

	execute(_i: Interaction, _e: Env): Response {
		return new PingResponse();
	}
}
