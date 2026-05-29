import { ButtonStyle, CommandOptionType } from '../lib/discord.ts';
import { ComponentResponse, InteractionResponse, MessageResponse } from '../lib/response.ts';
import { query } from '../waifu.ts';
import type { ClassDefinition, GameVersion } from '../graphql/graphql.ts';
import { type BoolArg, Command, type OptionGetter, type StringArg } from '../lib/command.ts';
import type { LoaderVersion } from '../lib/util.ts';
import { ActionButtonComponent, ActionRowComponent, ButtonComponent, Component, ContainerComponent, LinkButtonComponent, SectionComponent, TextComponent, ThumbnailComponent } from '../lib/component.ts';
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
		mods(where: {anyClass: {name: $predicate}} first: 10) {
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
type ModInfo = {
	versions: LoaderVersion[];
	modid: string;
	cfId: number;
	mrId: string;
	classes: ClassDefinition[];
};

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

	protected override async executeImpl(env: Env, getOption: OptionGetter<Args>): Promise<InteractionResponse> {
		const className = getOption('class');
		if (!className) return new MessageResponse('class parameter is required!');

		const regex = getOption('regex', false);

		if (!regex && className.includes('.'))
			return new MessageResponse(
				'class parameter needs to be in JVM format, not java format! Use `/` instead of `.` for package separation, and `$` instead of `.` for inner class separation.',
			);
		const predicate = regex ? { matches: className} : { equals: className };
		const result = (await query(Class, { predicate })) as {
			gameVersions: GameVersion[];
		};

		// TODO: duplicate modids are actually very common, so dedupe based on cf/mr ids i guess.
		const warnings: string[] = []
		const mods: Record<string, ModInfo> = {};
		for (const gameVersion of result.gameVersions) {
			const { loader, version } = gameVersion;
			const loaderVersion: LoaderVersion = [loader, version];
			for (const { node } of gameVersion.mods.edges) {
				const cf = node.curseforgeProjectId;
				const mr = node.modrinthProjectId;
				let classes = node.classes;
				const modids = node.modIds;
				// ignore anything but the primary modid
				// assume it is unique.
				const modid = modids?.[0] ?? node.name;

				let modInfo = mods[modid] ?? { modid , classes: [], classCount: 0, versions: [] };
				if (cf && modInfo.cfId && cf != modInfo.cfId) warnings.push(`Modid ${modid} matched multiple CF projects, only showing the first one`)
				if (mr && modInfo.mrId && mr != modInfo.mrId) warnings.push(`Modid ${modid} matched multiple MR projects, only showing the first one`)

				if (cf) modInfo.cfId = cf;
				if (mr) modInfo.mrId = mr;

				modInfo.versions.push(loaderVersion);
				modInfo.classes.push(...classes);
				mods[modid] = modInfo;
			}
		}

		if (Object.keys(mods).length === 0)
			return new MessageResponse(`No mods found containing a class matching \`${className}\``);

		const [mrModInfo, {data: cfModInfo}] = await Promise.all([
			mrModInfos(Object.values(mods).map(({mrId}) => mrId)),
			cfModInfos(Object.values(mods).map(({cfId}) => cfId)),
		])

		const mrMods: Record<string, Project> = mrModInfo.reduce((prev, cur) => Object.assign(prev, {[cur.id]: cur}), {} as Record<string, Project>);
		const cfMods: Record<number, CFMod> = cfModInfo.reduce((prev, cur) => Object.assign(prev, { [cur.id]: cur }), {} as Record<number, CFMod>);

		const components: Component[] = Object.values(mods).map(({ versions, modid, cfId, mrId, classes }) => {
			const cfSlug = cfMods[cfId]?.slug;
			const mrSlug = mrMods[mrId]?.slug
			const cfLink = cfSlug && new LinkButtonComponent(`https://www.curseforge.com/minecraft/mc-mods/${cfSlug}`, 'CurseForge', CURSEFORGE);
			const mrLink = mrSlug && new LinkButtonComponent(`https://modrinth.com/mod/${mrSlug}`, 'Modrinth', MODRINTH);
			const linkButtons: [ButtonComponent] | [ButtonComponent, ButtonComponent] = (cfLink && mrLink) ? [cfLink, mrLink] : (cfLink ? [cfLink] : (mrLink ? [mrLink] : [new ActionButtonComponent('Error', ButtonStyle.DANGER)]));
			return new ContainerComponent([
				new SectionComponent(
					[
						new TextComponent(
							`### ${cfMods[cfId]?.name ?? mrMods[mrId]?.title ?? 'unknown'}\n` +
								`-# ${modid}\n` +
								`Versions: ${versions.map(([l, v]) => `${l}-${v}`)}\n` +
								`Classes: \`${[...new Set(classes.map((cl) => cl.name.split('/').pop()))].join('`, `')}\``,
						),
					],
					new ThumbnailComponent(cfMods[cfId]?.logo?.url ?? mrMods[mrId]?.icon_url ?? 'invalid'),
				),
				new ActionRowComponent(linkButtons),
				...(warnings.length > 0 ? [new TextComponent(`⚠️ ${warnings.join('\n')} ⚠️`)] : []),
			]);
		});

		return new ComponentResponse(components)
	}
}
