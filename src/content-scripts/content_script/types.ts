// import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'

export interface ContentScriptRegistry {
    registerSearchInjectionScript(main: SearchInjectionMain): Promise<void>
}

export interface SearchInjectionDependencies {
    requestSearcher: any
    syncSettingsBG: void
}

export type SearchInjectionMain = (
    dependencies: SearchInjectionDependencies,
) => Promise<void>
