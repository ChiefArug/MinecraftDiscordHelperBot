import { CommandOptionType } from '../lib/discord.ts';
import { query } from '../waifu.ts';
import type { GameVersion } from '../graphql/graphql.ts';
import { type BoolArg, Command, type OptionGetter, type StringArg } from '../lib/command.ts';
import { LoaderVersion, ModKey, ModMap } from '../lib/util.ts';
import { ActionRowComponent, Component, ContainerComponent, LinkButtonComponent, SectionComponent, TextComponent, ThumbnailComponent } from '../lib/component.ts';
import { mrModInfos } from '../modrinth.ts';
import { cfModInfos } from '../curseforge.ts';
import { CFMod } from '../lib/cfTypes.ts';
import { Labrinth } from '@modrinth/api-client';
import { CURSEFORGE, MODRINTH } from '../lib/emoji.ts';

type Project = Labrinth.Projects.v2.Project;

// language=GraphQL
export const Class = `query Class($predicate: StringPredicate) {
	gameVersions {
		version
		loader
		mods(where: {anyClass: {name: $predicate}} first: 50) {
			count
			edges {
				node {
					curseforgeProjectId
					modrinthProjectId
					modIds
					classes (where: {name: $predicate}) {
						name
					}
				}
			}
		}
	}
}`;

type Args = StringArg<'class'> & BoolArg<'regex'>;

export class ClassCommand extends Command<Args> {
	constructor(name: string, description: string) {
		super(name, description, {
			class: {
				name: 'class',
				type: CommandOptionType.STRING,
				description: 'The classname to search for, in JVM format (ie java/lang/Character$Subset)',
				min_length: 4,
				max_length: 64,
				required: true,
			},
			regex: {
				name: 'regex',
				type: CommandOptionType.BOOLEAN,
				description: 'If the locator should use full regex',
			},
		});
	}

	protected override async executeImpl(env: Env, getOption: OptionGetter<Args>): Promise<Component[]> {
		const className = getOption('class');
		if (!className) return [new TextComponent('class parameter is required!')];

		const regex = getOption('regex', false);

		if (!regex && className.includes('.'))
			return [
				new TextComponent(
					'class parameter needs to be in JVM format, not java format! Use `/` instead of `.` for package separation, and `$` instead of `.` for inner class separation.',
				),
			];
		const predicate = regex ? { matches: className } : { equals: className };
		const result = (await query(Class, { predicate })) as {
			gameVersions: GameVersion[];
		};

		const mods: ModMap = new ModMap();
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			const loaderVersion: LoaderVersion = [loader, version];
			for (const { node } of gameVersion.mods.edges) {
				const cf = node.curseforgeProjectId ?? undefined;
				const mr = node.modrinthProjectId ?? undefined;
				let classes = node.classes;
				const modids = node.modIds;
				// ignore anything but the primary modid
				const modid = modids?.[0] ?? node.name;
				const key: ModKey = [cf, mr];

				let extra = mods.update(key, loaderVersion, () => ({
					modid,
					cfId: cf,
					mrId: mr,
					versions: [loaderVersion],
					extra: []
				}));

				classes.forEach(({name}) => extra(name))
			}
		}

		if (Object.keys(mods).length === 0) return [new TextComponent(`No mods found containing a class matching \`${className}\``)];

		const [mrModInfo, { data: cfModInfo }] = await Promise.all([
			mrModInfos(mods.getModrinthIds()),
			cfModInfos(mods.getCurseForgeIds()),
		]);

		const mrMods: Record<string, Project> = mrModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<string, Project>,
		);
		const cfMods: Record<number, CFMod> = cfModInfo.reduce(
			(prev, cur) => Object.assign(prev, { [cur.id]: cur }),
			{} as Record<number, CFMod>,
		);

		return mods.getModInfos().map(({ versions, modid, cfId, mrId, extra }) => {
			const cfProj = cfId !== undefined ? cfMods[cfId] : undefined;
			const mrProj = mrId !== undefined ? mrMods[mrId] : undefined;
			const cfSlug = cfProj?.slug;
			const mrSlug = mrProj?.slug;
			const cfLink = cfSlug !== undefined
				? new LinkButtonComponent(`https://www.curseforge.com/minecraft/mc-mods/${cfSlug}`, 'CurseForge', CURSEFORGE)
				: undefined;
			const mrLink = mrSlug !== undefined ? new LinkButtonComponent(`https://modrinth.com/mod/${mrSlug}`, 'Modrinth', MODRINTH) : undefined;
			const linkButtons: [] | [LinkButtonComponent] | [LinkButtonComponent, LinkButtonComponent] =
				cfLink && mrLink ? [cfLink, mrLink] : cfLink ? [cfLink] : mrLink ? [mrLink] : [];
			const linkButtonsComponent = linkButtons.length == 0 ? linkButtons : [new ActionRowComponent(linkButtons)];
			const classStrings: string[] = [];
			for (const clss of extra) {
				const name = clss.split('/').pop()!;
				if (!(name in classStrings)) classStrings.push(`\`${name}\``);
				if (classStrings.length >= 5) break;
			}
			const classString = classStrings.join(', ') + (extra.length > 5 ? ` and ${extra.length - 5} more` : '');

			const imageUrl: string | undefined = cfProj?.logo?.url ?? mrProj?.icon_url;
			const bodyCore = new TextComponent(
				`### ${cfProj?.name ?? mrProj?.title ?? 'Unknown'}\n` +
					`-# ${modid}\n` +
					`Versions: ${versions.map(([l, v]) => `${l}-${v}`).join(', ')}\n` +
					`Classes: ${classString}`,
			);
			const bodyComponent = imageUrl ? new SectionComponent([bodyCore], new ThumbnailComponent(imageUrl)) : bodyCore;

			return new ContainerComponent([
				bodyComponent,
				...linkButtonsComponent,
			]);
		});
	}
}
