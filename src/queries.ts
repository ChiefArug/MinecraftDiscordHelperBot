// noinspection SpellCheckingInspection


// language=GraphQL
export const MixinExtrasNeoForgeOnForge = `query ModsWithMEForge {
    gameVersion(loader: Forge, version: "1.20.1") {
        mods(
            where: {
                anyNestedArtifact: {
                    id: {matches: "io.github.llamalad7:mixinextras-neoforge"}
                }
            }
        ) {
            edges {
                node {
                    curseforgeProjectId
                    modrinthProjectId
                    modIds
                }
            }
            count
        }
    }
}
`

// language=GraphQL
export const MixinExtrasForgeOnNeoForge = `query ModsWithMEForge {
    gameVersion(loader: NeoForge, version: "1.21.1") {
        mods(
            where: {
                anyNestedArtifact: {
                    id: {matches: "io.github.llamalad7:mixinextras-forge"}
                }
            }
        ) {
            edges {
                node {
                    curseforgeProjectId
                    modrinthProjectId
                    modIds
                }
            }
            count
        }
    }
}
`

// language=GraphQL
export const ModId = `query ModId($modid: String) {
	gameVersions {
        version
        loader
		mods(where: {modId: {equals: $modid}}, first: 2) {
			edges {
                node {
                    curseforgeProjectId
                    modrinthProjectId

                    modIds
                }
			}
		}
	}
}
`
// language=GraphQL
export const JIJ = `query JIJ($term: String) {
	gameVersions {
		version
		loader
		mods(where: {anyNestedArtifact: {id: {matches: $term}}} first: 10) {
			count
			edges {
				node {
					curseforgeProjectId
					modrinthProjectId
					modIds
					nestedArtifactsFlat {
						id
						version
					}
				}
			}
		}
	}
}`
