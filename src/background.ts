import 'core-js'
import { setupRpcConnection } from 'src/util/webextensionRPC'
import {
    createBackgroundModules,
    setupBackgroundModules,
} from './background-script/setup'
import { browser } from 'webextension-polyfill-ts'

export async function main() {
    const rpcManager = setupRpcConnection({
        sideName: 'background',
        role: 'background',
        paused: true,
    })

    const backgroundModules = createBackgroundModules({
        browserAPIs: browser,
    })

    await setupBackgroundModules(backgroundModules)

    window['bgModules'] = backgroundModules

    rpcManager.unpause()
}

main()
