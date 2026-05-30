import { CFMod } from './lib/cfTypes.ts';
import { env } from 'cloudflare:workers';
import { checkSuccess } from './lib/util.ts';

const URL = 'https://api.curseforge.com/v1/';

export type CurseForgeProject = CFMod

const auth: {'X-API-Key': string} = { 'X-API-Key': env.CURSEFORGE_TOKEN! }

export const cfModInfo = async (id: number): Promise<{data: CurseForgeProject}> => {
	return fetch(URL + `mods/${id}` + id, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...auth,
		},
	})
		.then(checkSuccess('CurseForge'))
		.then((res) => res.json());
};

export const cfModInfos = async (ids: number[]): Promise<{data: CurseForgeProject[]}> => {
	return await fetch(URL + `mods/`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...auth
		},
		body: JSON.stringify({ modIds: ids })
	})
		.then(checkSuccess('CurseForge'))
		.then(async (res) => res.json());
};
