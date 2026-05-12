import { CFMod } from './lib/cfTypes.ts';

const URL = 'https://api.curseforge.com/v1/';

export type CurseForgeProject = CFMod

const auth: {'X-API-Key': string} = { 'X-API-Key': process.env.CURSEFORGE_TOKEN! }

export const modInfo = async (id: number): Promise<{data: CurseForgeProject}> => {
	return fetch(URL + `mods/${id}` + id, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...auth
		}
	}).then((res) => res.json());
};

export const modInfos = async (ids: number[]): Promise<{data: CurseForgeProject[]}> => {
	return fetch(URL + `mods`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...auth
		},
		body: JSON.stringify({ modIds: ids })
	}).then((res) => res.json());
};
