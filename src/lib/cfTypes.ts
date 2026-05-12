import type { CurseForgeCategory,
	CurseForgeFileDependency, CurseForgeFileHash, CurseForgeFileIndex,
	CurseForgeFileModule, CurseForgeFileReleaseType, CurseForgeFileStatus, CurseForgeModAsset, CurseForgeModAuthor, CurseForgeModLinks, CurseForgeModStatus, CurseForgeSortableGameVersion } from 'curseforge-api/v1/Types';

// existing types are used where possible, otherwise copied here.

export type CFMod = {
	id: number;
	gameId: number;
	name: string;
	slug: string;
	links: CurseForgeModLinks;
	summary: string;
	status: CurseForgeModStatus;
	downloadCount: number;
	isFeatured: boolean;
	primaryCategoryId: number;
	categories: CurseForgeCategory[];
	classId: number | null;
	authors: CurseForgeModAuthor[];
	logo: CurseForgeModAsset;
	screenshots: CurseForgeModAsset[];
	mainFileId: number;
	latestFiles: CFFile[];
	latestFilesIndexes: CurseForgeFileIndex[];
	latestEarlyAccessFilesIndexes: CurseForgeFileIndex[];
	dateCreated: Date;
	dateModified: Date;
	dateReleased: Date;
	allowModDistribution: boolean | null;
	gamePopularityRank: number;
	isAvailable: boolean;
	thumbsUpCount: number;
	rating: number | null;
};

export type CFFile = {
	id: number;
	gameId: number;
	modId: number;
	isAvailable: boolean;
	displayName: string;
	fileName: string;
	releaseType: CurseForgeFileReleaseType;
	fileStatus: CurseForgeFileStatus;
	hashes: CurseForgeFileHash[];
	fileDate: Date;
	fileLength: number;
	downloadCount: number;
	fileSizeOnDisk: number | null;
	downloadUrl: string;
	gameVersions: string[];
	sortableGameVersions: CurseForgeSortableGameVersion[];
	dependencies: CurseForgeFileDependency[];
	exposeAsAlternative: boolean | null;
	parentProjectFileId: number | null;
	alternateFileId: number | null;
	isServerPack: boolean | null;
	serverPackFileId: number | null;
	isEarlyAccessContent: boolean | null;
	earlyAccessEndDate: Date | null;
	fileFingerprint: number;
	modules: CurseForgeFileModule[];
};
