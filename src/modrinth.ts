import { type Labrinth } from '@modrinth/api-client'

const URL = 'https://api.modrinth.com/v2/';

export type ModrinthProject = Labrinth.Projects.v2.Project;

export const test = async (): Promise<object> => {
	return await fetch(URL + 'statistics').then(res => res.json())
}

export const mrModInfo = async (id: string): Promise<ModrinthProject> => {
	return await fetch(URL + 'project/' + id).then((res) => res.json());
};

export const mrModInfos = async (ids: string[]): Promise<ModrinthProject[]> => {
	return await fetch(URL + `projects?ids=["${ids.join('","')}"]`)
		.then(res => res.json())
}
