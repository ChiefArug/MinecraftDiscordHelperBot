import { ActionButtonComponent, ActionRowComponent, Component, countComponents, MAX_COMPONENTS } from './component.ts';
import { ButtonStyle } from './discord.ts';

/** The maximum number of components per page, with 4 components available for pagination */
export const PAGE_SIZE = MAX_COMPONENTS - 4;


// TODO: disable buttons if last/first page.
//  probably requires incorporating this into getPage.
export const makePaginationButtons = (commandName: string, interactionId: string, curPage: number) =>  new ActionRowComponent([
	new ActionButtonComponent('<', ButtonStyle.SECONDARY, `<-${commandName}-${interactionId}-${curPage}`),
	new ActionButtonComponent('>', ButtonStyle.SECONDARY, `>-${commandName}-${interactionId}-${curPage}`),
])

/**
 * Gets a pages worth of components
 * @param components The component (or component-like) to pull from
 * @param page The page number to get.
 * @returns The array of components for the specified page. If the page is not valid (ie less than 1 or greater than the required pages for the provided components) then will be an empty array.
 */
export const getPage = (components: Component[], page: number): Component[] => {
	if (page < 1) return [];

	let curPageSize = 0;
	let curPage = 1;
	const collected: Component[] = [];

	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		const count = countComponents(component);
		if (curPageSize + count <= PAGE_SIZE) {
			// on the same page
			curPageSize += count;
			if (curPage === page) {
				collected.push(component);
			}
		} else if (curPage === page) {
			// the end of our current page, we need not go further
			break;
		} else {
			// new page
			curPage++;
			curPageSize = 0;
		}
	}
	return collected;
}
