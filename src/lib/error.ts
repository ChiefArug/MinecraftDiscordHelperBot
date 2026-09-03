import { CHIEFARUG } from './discord_constants.ts';
import { CommandInteraction } from './discord.ts';

export function log(id: string, message: string, interaction?: CommandInteraction<any>): void {
	if (interaction !== undefined) {
		const {
			data: { name, options },
		} = interaction;
		console.log({
			id,
			message,
			command: name,
			options,
		});
	} else {
		console.log({
			id,
			message,
		});
	}
}

export function warning(id: string, message: string, interaction?: CommandInteraction<any>): void {
	if (interaction !== undefined) {
		const {
			data: { name, options },
		} = interaction;
		console.warn({
			id, message, command: name, options,
		})
	} else {
		console.warn({
			id,
			message,
		});
	}
}

// TODO: DM me with all errors as well.
export function error(id: string, message: string, interaction?: CommandInteraction<any>): void {
	if (interaction !== undefined) {
		const {
			data: { name, options },
		} = interaction;
		console.error({
			id,
			message,
			command: name,
			options,
		});
	} else {
		console.error({
			id,
			message,
		});
	}
}

export function errorResponse(id: string, message: string, interaction?: CommandInteraction<any>, secret: boolean = true): string {
	error(id, message, interaction);
	return secret
		? `An error occurred executing that. Id for logging: ${id}. Go yell at ${CHIEFARUG}.`
		: `An error occurred executing ${interaction === undefined ? 'that' : `/${interaction.data.name}`}. Id for logging: ${id}.\nError: ${message}`;
}

export function extractStack(err: any) {
	return 'stack' in err ? err + ':\n' + err.stack : String(err);
}
