import { type Labrinth } from '@modrinth/api-client'
import { checkSuccess } from './lib/util.ts';

const URL = 'https://api.modrinth.com/v2/';
export const MR_SERVER_ID = '734077874708938864';

export type ModrinthProject = Labrinth.Projects.v2.Project;

export const test = async (): Promise<object> => {
	return await fetch(URL + 'statistics')
		.then(checkSuccess('Modrinth'))
		.then((res) => res.json());
}

export const mrModInfo = async (id: string): Promise<ModrinthProject> => {
	return await fetch(URL + 'project/' + id)
		.then(checkSuccess('Modrinth'))
		.then((res) => res.json());
};

export const mrModInfos = async (ids: string[]): Promise<ModrinthProject[]> => {
	if (ids.length === 0) return [];
	return await fetch(URL + `projects?ids=["${ids.join('","')}"]`)
		.then(checkSuccess('Modrinth'))
		.then((res) => res.json());
}
