import { type Labrinth } from '@modrinth/api-client'

const URL = 'https://api.modrinth.com/v2/';

export type ModrinthProject = Labrinth.Projects.v2.Project;

export const test = async (): Promise<object> => {
	return fetch(URL + 'statistics').then(res => res.json())
}

export const modInfo = async (id: string): Promise<ModrinthProject> => {
	return fetch(URL + 'project/' + id).then((res) => res.json());
};

export const modInfos = async (ids: string[]): Promise<ModrinthProject[]> => {
	return fetch(URL + `projects?ids=["${ids.join('","')}"]`)
		.then(res => res.json())
}
