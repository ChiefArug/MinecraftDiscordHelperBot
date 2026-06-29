import { CFMod } from './lib/cfTypes.ts';
import { env } from 'cloudflare:workers';
import { checkSuccess } from './lib/util.ts';

const URL = 'https://api.curseforge.com/v1/';
export const CF_SERVER_IDS = new Set(['428228256236306434', '900128427150028811']);

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
	if (ids.length === 0) return {data: []};

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
