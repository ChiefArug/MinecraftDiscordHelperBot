import { ActionRowComponent, Component, ContainerComponent, LinkButtonComponent, SectionComponent, TextComponent, ThumbnailComponent } from './component.ts';
import { CFMod } from './cfTypes.ts';
import { ModrinthProject } from '../modrinth.ts';
import { CURSEFORGE, GITHUB, MODRINTH } from './emoji.ts';
import { ModInfo } from './modInfo.ts';


/**
 * Get the link component for a provided CurseForge and/or Modrinth slug.
 * @param cfSlug The CurseForge project slug
 * @param mrSlug The Modrinth project slug
 * @param ghSlug The GitHub slug
 * @returns an array containing an {@link ActionRowComponent}, or an empty array if no slugs are defined.
 */
function getLinkComponent(cfSlug: string | undefined, mrSlug: string | undefined, ghSlug: string | undefined): [] | [Component] {
	const linkButtons: LinkButtonComponent[] = [];

	if (cfSlug !== undefined) {
		linkButtons.push(new LinkButtonComponent(`https://www.curseforge.com/minecraft/mc-mods/${cfSlug}`, '', CURSEFORGE));
	}
	if (mrSlug !== undefined) {
		linkButtons.push(new LinkButtonComponent(`https://modrinth.com/mod/${mrSlug}`, '', MODRINTH));
	}
	if (ghSlug !== undefined) {
		linkButtons.push(new LinkButtonComponent(`https://github.com/${ghSlug}`, '', GITHUB));
	}

	return linkButtons.length === 0 ? [] : linkButtons.length <= 5 ? [new ActionRowComponent(linkButtons as any)] : [new TextComponent('Too many buttons to display!')];
}

const githubRegex = new RegExp('https://(?:www\.)?github.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)(?:/.*)?', '');
function findGithubSlug(cf?: CFMod, mr?: ModrinthProject) {
	const all = [
		cf?.links.issuesUrl ?? undefined,
		cf?.links.sourceUrl ?? undefined,
		mr?.issues_url ?? undefined,
		mr?.source_url ?? undefined,
		mr?.wiki_url ?? undefined,
	];
	for (const url of all) {
		if (url === undefined) continue;
		const match = url.match(githubRegex);
		if (match === null) continue;
		const slug = match[1];
		if (slug === undefined) continue;
		return slug;
	}
}

/**
 * A special container component that displays information about a mod
 */
export class ModInfoComponent extends ContainerComponent {
	/**
	 * If both cf and mr are undefined it is assumed that this mod is a jar-in-jar mod.
	 * @param modInfo General information about the mod
	 * @param cf Optional data from CurseForge about this mod
	 * @param mr Optional data from Modrinth about this mod
	 * @param extrasProcessor The stringifier function to display the modInfo's `extra` data.
	 */
	constructor(
		modInfo: ModInfo,
		cf: CFMod | undefined,
		mr: ModrinthProject | undefined,
		extrasProcessor: (extra: Set<string>) => string = (e) => [...e].join(', '),
	) {

		const ghSlug = findGithubSlug(cf, mr);
		const linkButtonsComponent = getLinkComponent(cf?.slug, mr?.slug, ghSlug);
		const extrasString = extrasProcessor(modInfo.extra);
		const imageUrl: string | undefined = cf?.logo?.url ?? mr?.icon_url;
		const displayName = cf?.name ?? mr?.title;
		const bodyCore = new TextComponent( // jar-in-jar assumption based on there not being an associated project.
			(displayName ? `**${displayName}** (\`${modInfo.modid}\`)` : `**\`${modInfo.modid}\`** (Jar-in-Jar)`) + '\n' +
						`Versions: ${modInfo.versions.map(([l, v]) => `${l}-${v}`).join(', ')}\n` +
						`${extrasString}`,
		);
		const bodyComponent = imageUrl ? new SectionComponent([bodyCore], new ThumbnailComponent(imageUrl)) : bodyCore;

		super([bodyComponent, ...linkButtonsComponent]);
	}
}
