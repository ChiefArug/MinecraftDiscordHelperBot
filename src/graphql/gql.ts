/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\nquery ModsWithMEForge {\n\tgameVersion(loader: NeoForge, version: \"1.21.1\") {\n\t\tmods(\n\t\twhere: {\n\t\t\tanyNestedArtifact: {\n\t\t\tid: {matches: \"io.github.llamalad7:mixinextras-forge\"}\n\t\t\t}\n\t\t}\n\t\t) {\n\t\tedges {\n\t\t\tnode {\n\t\t\tcurseforgeProjectId\n\t\t\tmodrinthProjectId\n\t\t\tmodIds\n\t\t\tmavenCoordinates\n\t\t\t}\n\t\t}\n\t\t}\n\t}\n}\n": typeof types.ModsWithMeForgeDocument,
};
const documents: Documents = {
    "\nquery ModsWithMEForge {\n\tgameVersion(loader: NeoForge, version: \"1.21.1\") {\n\t\tmods(\n\t\twhere: {\n\t\t\tanyNestedArtifact: {\n\t\t\tid: {matches: \"io.github.llamalad7:mixinextras-forge\"}\n\t\t\t}\n\t\t}\n\t\t) {\n\t\tedges {\n\t\t\tnode {\n\t\t\tcurseforgeProjectId\n\t\t\tmodrinthProjectId\n\t\t\tmodIds\n\t\t\tmavenCoordinates\n\t\t\t}\n\t\t}\n\t\t}\n\t}\n}\n": types.ModsWithMeForgeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nquery ModsWithMEForge {\n\tgameVersion(loader: NeoForge, version: \"1.21.1\") {\n\t\tmods(\n\t\twhere: {\n\t\t\tanyNestedArtifact: {\n\t\t\tid: {matches: \"io.github.llamalad7:mixinextras-forge\"}\n\t\t\t}\n\t\t}\n\t\t) {\n\t\tedges {\n\t\t\tnode {\n\t\t\tcurseforgeProjectId\n\t\t\tmodrinthProjectId\n\t\t\tmodIds\n\t\t\tmavenCoordinates\n\t\t\t}\n\t\t}\n\t\t}\n\t}\n}\n"): typeof import('./graphql').ModsWithMeForgeDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
