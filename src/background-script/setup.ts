import TabManagementBackground from 'src/tab-management/background'
import { TabManager } from 'src/tab-management/background/tab-manager'
import { Browser } from 'webextension-polyfill-ts'
import BackgroundScript from '.'

export interface BackgroundModules {
    tabManagement: TabManagementBackground
    bgScript: BackgroundScript
}

export function createBackgroundModules(options: {
    browserAPIs: Browser
    tabManager?: TabManager
    getNow?: () => number
}): BackgroundModules {
    const tabManager = options.tabManager || new TabManager()
    const tabManagement = new TabManagementBackground({
        tabManager,
        browserAPIs: options.browserAPIs,
    })

    tabManagement.events.on('tabRemoved', (event) => {})

    const bgScript = new BackgroundScript({
        tabManagement,
    })

    return {
        tabManagement,
        bgScript,
    }
}

export async function setupBackgroundModules(
    backgroundModules: BackgroundModules,
) {
    backgroundModules.tabManagement.setupRemoteFunctions()
}
