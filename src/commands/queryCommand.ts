import { CommandOptionType } from '../lib/discord.ts';
import { InteractionResponse, MessageResponse } from '../lib/response.ts';
import { query } from '../waifu.ts';
import { AckNow, Command, OptionGetter, SimpleString } from '../lib/command.ts';

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
