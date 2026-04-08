/**
 * @type {[string]: string}
 */
import { COMMANDS, type CommandName } from './commands.ts';
import fetch from 'node-fetch';
import fs from 'node:fs';

/**
 * This file is meant to be run from the command line, and is not used by the
 * application server. It's allowed to use node.js primitives, and only needs
 * to be run once.
 */

const token = fs.readFileSync('.token');
const applicationId = fs.readFileSync('.appid');

if (!token) {
  throw new Error('The DISCORD_TOKEN environment variable is required.');
}
if (!applicationId) {
  throw new Error(
    'The DISCORD_APPLICATION_ID environment variable is required.'
  );
}


const filter = new Set(process.argv.slice(2).filter(s => s.length > 0).flatMap(s => s.split(" ")));
const commandsToRegister = (filter.size > 0 ? Object.keys(COMMANDS)
    .filter(c => filter.has(c)) : Object.keys(COMMANDS))
    .map((k) => ({name: k, ...COMMANDS[k as CommandName]}))
console.log(commandsToRegister)

/**
 * Register all commands globally.  This can take o(minutes), so wait until
 * you're sure these are the commands you want.
 */
async function registerGlobalCommands() {
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;
  await registerCommands(url);
}

async function registerCommands(url: string) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'PUT',
    body: JSON.stringify(commandsToRegister),
  });

  if (response.ok) {
    console.log(`Registered ${commandsToRegister.length}/${Object.keys(COMMANDS).length} commands`);
  } else {
    console.error('Error registering commands');
    const text = await response.text();
    console.error(text);
  }
  return response;
}

await registerGlobalCommands();
