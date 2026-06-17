import { ActionRowComponent, Component, ContainerComponent, LinkButtonComponent, SectionComponent, TextComponent, ThumbnailComponent } from './component.ts';
import { FilledModInfo } from './modInfo.ts';
import { PartialEmoji } from './discord.ts';
import { THEME_COLOUR_DEC } from '../index.ts';


/**
 * Build the link component from a set of links
 * @param links A list of links and their associated display emoji
 * @returns an array containing an {@link ActionRowComponent}, or an empty array if no slugs are defined.
 */
function getLinkComponent(links: Record<string, PartialEmoji>): [] | [Component] {
	const linkButtons: LinkButtonComponent[] = Object.entries(links).map(([link, emoji]) => new LinkButtonComponent(link, '', emoji));

	return linkButtons.length === 0 ? [] : linkButtons.length <= 5 ? [new ActionRowComponent(linkButtons as any)] : [new TextComponent('Too many buttons to display!')];
}

/**
 * A special container component that displays information about a mod
 */
export class ModInfoComponent extends ContainerComponent {
	/**
	 * If both cf and mr are undefined it is assumed that this mod is a jar-in-jar mod.
	 * @param modInfo Information about the mod
	 * @param i
	 * @param extrasProcessor The stringifier function to display the modInfo's `extra` data.
	 */
	constructor(
		{ displayName, modid, links, extra, versions, imageUrl}: FilledModInfo,
		i: number,
		extrasProcessor: (extra: Set<string>) => string = (e) => [...e].join(', '),
	) {
		const bodyCore = new TextComponent( // jar-in-jar assumption based on there not being an associated project.
			(displayName ? `**${displayName}** (\`${modid}\`)` : `**\`${modid}\`** (Jar-in-Jar)`) + '\n' +
						`Versions: ${versions.map(([l, v]) => `${l}-${v}`).join(', ')}\n` +
						`${(extrasProcessor(extra))}`,
		);
		const bodyComponent = imageUrl ? new SectionComponent([bodyCore], new ThumbnailComponent(imageUrl)) : bodyCore;

		super([bodyComponent, ...getLinkComponent(links)], THEME_COLOUR_DEC, false, i);
	}
}
