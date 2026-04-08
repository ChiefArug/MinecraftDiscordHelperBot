import { CommandOptionType, type CommandOption } from "./discord.ts"




const __commands = {
  ping: { description: "Is the bot online?" },
  test: { description: "Test command - could do anything. Run it and see!" },
	modid: {
		description: "Look up information about a particular Mod ID",
		options: [
			{
				type: CommandOptionType.STRING,
				name: "modid",
				description: "Mod ID to search for",
				min_length: 2,
				max_length: 64
			}
		]
	},
  query: {
    description: "Run the query passed in as a string",
    options: [
      {
        type: CommandOptionType.STRING,
        name: "query",
        description: "The query",
        min_length: 7,
      }
    ]
  },
}
export declare type CommandName = keyof typeof __commands
export const COMMANDS = __commands as Record<CommandName,{description: string, options?: CommandOption[]}>
