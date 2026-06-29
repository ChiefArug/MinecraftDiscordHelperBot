import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import { errorResult, Command, CommandResult, type OptionGetter, type StringArg } from '../lib/command.ts';

export class QueryCommand extends Command<StringArg<'query'>> {
	constructor(name: string, description: string) {
		super(name, description, {
			query: {
				name: 'query',
				type: CommandOptionType.STRING,
				description: 'The query to execute',
				min_length: 20,
				max_length: 2000,
				required: true,
			},
		});
	}

	protected async executeImpl(_e: Env, getOption: OptionGetter<StringArg<'query'>>, id: string): Promise<CommandResult> {
		const q = getOption('query');
		if (!q) return errorResult('Query was null!');
		const queryResult = await query(q);
		//TODO: respond with file if too large
		return errorResult(`\`\`\`json\n${JSON.stringify(queryResult, null, 1)}\`\`\``);
	}
}
