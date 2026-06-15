import { ActionRowComponent, Component, ContainerComponent, LinkButtonComponent, SectionComponent, TextComponent, ThumbnailComponent } from './component.ts';
import { CFMod } from './cfTypes.ts';
import { ModrinthProject } from '../modrinth.ts';
import { CURSEFORGE, MODRINTH } from './emoji.ts';
import { ModInfo } from './modInfo.ts';


function getLinkComponent(cfSlug: string | undefined, mrSlug: string | undefined): Component[] {
	const cfLink =
		cfSlug !== undefined
			? new LinkButtonComponent(`https://www.curseforge.com/minecraft/mc-mods/${cfSlug}`, '', CURSEFORGE)
			: undefined;
	const mrLink = mrSlug !== undefined ? new LinkButtonComponent(`https://modrinth.com/mod/${mrSlug}`, '', MODRINTH) : undefined;
	const linkButtons: [] | [LinkButtonComponent] | [LinkButtonComponent, LinkButtonComponent] =
		cfLink && mrLink ? [cfLink, mrLink] : cfLink ? [cfLink] : mrLink ? [mrLink] : [];

	return linkButtons.length == 0 ? linkButtons : [new ActionRowComponent(linkButtons)];
}

export class ModInfoComponent extends ContainerComponent {
	constructor(
		modInfo: ModInfo,
		cf: CFMod | undefined,
		mr: ModrinthProject | undefined,
		extrasProcessor: (extra: Set<string>) => string = (e) => [...e].join(', '),
	) {
		const linkButtonsComponent = getLinkComponent(cf?.slug, mr?.slug);
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
