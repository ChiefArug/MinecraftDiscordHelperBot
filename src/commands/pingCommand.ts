import { Command, type OptionGetter } from '../lib/command.ts';
import { Component, TextComponent } from '../lib/component.ts';

export class PingCommand extends Command<never> {
	constructor(name: string, description: string) {
		super(name, description);
	}

	executeImpl(_e: Env, _go: OptionGetter<never>, id: string): Promise<Component[]> {
		return Promise.resolve([new TextComponent('Pong!')]);
	}
}
