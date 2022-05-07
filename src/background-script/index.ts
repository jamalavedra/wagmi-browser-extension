import type { URLNormalizer } from '../util/url-utils'

import * as utils from './utils'
import { makeRemotelyCallable } from '../util/webextensionRPC'
import { __OLD_INSTALL_TIME_KEY } from 'src/constants'

import type TabManagementBackground from 'src/tab-management/background'
import type { RemoteBGScriptInterface } from './types'

interface Dependencies {
    tabManagement: TabManagementBackground
}

class BackgroundScript {
    private remoteFunctions: RemoteBGScriptInterface
    constructor(public deps: Dependencies) {}
    get defaultUninstallURL() {
        return process.env.NODE_ENV === 'production'
            ? 'https://us-central1-worldbrain-1057.cloudfunctions.net/uninstall'
            : 'https://us-central1-worldbrain-staging.cloudfunctions.net/uninstall'
    }

    async handleInstallLogic(now = Date.now()) {
        // Ensure default blacklist entries are stored (before doing anything else)

        // await this.runOnboarding()
        console.log('handle installing here ')
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }
}

export { utils }
export default BackgroundScript
