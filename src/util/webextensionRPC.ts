// A Remote Procedure Call abstraction around the message passing available to
// WebExtension scripts. Usable to call a function in the background script from
// a tab's content script, or vice versa.
//
// The calling side always gets a Promise of the return value. The executing
// (remote) function can be an async function (= it returns a Promise), whose
// completion then will then be waited for.

// Example use:
//
// === background.js ===
// function myFunc(arg) {
//     return arg*2
// }
// makeRemotelyCallable({myFunc})
//
// === content_script.js ===
// const myRemoteFunc = remoteFunction('myFunc')
// myRemoteFunc(21).then(result => { ... result is 42! ... })

import { PortBasedRPCManager, RpcSideName, RpcRole } from 'src/util/rpc/rpc'
import { browser } from 'webextension-polyfill-ts'
import mapValues from 'lodash/fp/mapValues'

export class RpcError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name
    }
}

export type RemoteFunctionRole = 'provider' | 'caller'
export type RemoteFunction<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? (info: { tab?: { id: number } }, params: Params) => Promise<Returns>
    : (params: Params) => Promise<Returns>
export type RemoteFunctionWithExtraArgs<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? {
          withExtraArgs: true
          function: RemoteFunction<Role, Params, Returns>
      }
    : RemoteFunction<Role, Params, Returns>
export type RemoteFunctionWithoutExtraArgs<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? {
          withExtraArgs: false
          function: (params: Params) => Promise<Returns>
      }
    : (params: Params) => Promise<Returns>
export function remoteFunctionWithExtraArgs<Params, Returns = void>(
    f: RemoteFunction<'provider', Params, Returns>,
): RemoteFunctionWithExtraArgs<'provider', Params, Returns> {
    return { withExtraArgs: true, function: f }
}
export function remoteFunctionWithoutExtraArgs<Params, Returns = void>(
    f: (params: Params) => Promise<Returns>,
): RemoteFunctionWithoutExtraArgs<'provider', Params, Returns> {
    return { withExtraArgs: false, function: f }
}
export function registerRemoteFunctions<Functions>(
    functions: {
        [Name in keyof Functions]:
            | RemoteFunctionWithExtraArgs<'provider', any, any>
            | RemoteFunctionWithoutExtraArgs<'provider', any, any>
    },
) {
    for (const [name, metadata] of Object.entries(functions)) {
        const typedMetadata = metadata as
            | RemoteFunctionWithExtraArgs<'provider', any, any>
            | RemoteFunctionWithoutExtraArgs<'provider', any, any>
        makeRemotelyCallable(
            { [name]: typedMetadata.function },
            { insertExtraArg: typedMetadata.withExtraArgs },
        )
    }
}
// runInBackground creates a Proxy object that look like the real interface but actually call remote functions
//
// When the Proxy is asked for a property (such as a method)
// return a function that executes the requested method over the RPC interface
//
// Example Usage:
//      interface AnalyticsInterface { trackEvent({}) => any }
//      const analytics = runInBackground<AnalyticsInterface>()
//      analytics.trackEvent(...)

// Runs a remoteFunction in the background script
export function runInBackground<T extends object>(): T {
    return new Proxy<T>({} as T, {
        get(target, property): (...args: any[]) => Promise<any> {
            return async (...args) =>
                rpcConnection.postMessageRequestToExtension(
                    property.toString(),
                    args,
                )
        },
    })
}

export class RemoteFunctionRegistry {
    registerRemotelyCallable(functions, { insertExtraArg = false } = {}) {
        makeRemotelyCallable(functions, { insertExtraArg })
    }
}



// Runs a remoteFunction in the content script on a certain tab
export function runInTab<T extends object>(tabId): T {
    return new Proxy<T>({} as T, {
        get(target, property): any {
            return (...args) =>
                rpcConnection.postMessageRequestToTab(
                    tabId,
                    property.toString(),
                    args,
                )
        },
    })
}

// Register a function to allow remote scripts to call it.
// Arguments:
// - functions (required):
//     An object with a {functionName: function} mapping.
//     Each function will be callable with the given name.
// - options (optional): {
//       insertExtraArg:
//           If truthy, each executed function also receives, as its first
//           argument before the arguments it was invoked with, an object with
//           the details of the tab that sent the message.
//   }
export function makeRemotelyCallableType<T = never>(
    functions: { [P in keyof T]: T[P] },
    { insertExtraArg = false } = {},
) {
    return makeRemotelyCallable(functions, { insertExtraArg })
}

// @depreciated - Don't call this function directly. Instead use the above typesafe version runInBackground
export function remoteFunction(
    funcName: string,
    { tabId }: { tabId?: number } = {},
): any {
    // console.log(`depreciated: remoteFunction call for: ${funcName}`)
    if (tabId) {
        return (...args) =>
            rpcConnection.postMessageRequestToTab(tabId, funcName, args)
    } else {
        return (...args) =>
            rpcConnection.postMessageRequestToExtension(funcName, args)
    }
}

// @Depreciated to call this directly. Should use the above typesafe version
export function makeRemotelyCallable<T>(
    functions: { [P in keyof T]: T[P] },
    { insertExtraArg = false } = {},
) {
    // Every function is passed an extra argument with sender information,
    // so remove this from the call if this was not desired.
    if (!insertExtraArg) {
        // Replace each func with...
        // @ts-ignore
        const wrapFunctions = mapValues((func) =>
            // ...a function that calls func, but hides the inserted argument.
            // @ts-ignore
            (extraArg, ...args) => func(...args),
        )
        // @ts-ignore
        functions = wrapFunctions(functions)
    }

    for (const functionName of Object.keys(functions)) {
        if (remotelyCallableFunctions.hasOwnProperty(functionName)) {
            const error = `RPC function with name ${functionName} has already been registered `
            console.warn(error)
        }
    }
    // Add the functions to our global repetoir.
    Object.assign(remotelyCallableFunctions, functions)
    // console.log('assigned to remotelyCallableFunctions this new functions', {
    //     functions,
    // })
}

const remotelyCallableFunctions =
    typeof window !== 'undefined' ? window['remoteFunctions'] || {} : {}
if (typeof window !== 'undefined') {
    window['remoteFunctions'] = remotelyCallableFunctions
}

let rpcConnection: PortBasedRPCManager
export const setupRpcConnection = (options: {
    sideName: RpcSideName
    role: RpcRole
    paused?: boolean
}) => {
    rpcConnection = new PortBasedRPCManager({
        sideName: options.sideName,
        role: options.role,
        getRegisteredRemoteFunction: (name) => remotelyCallableFunctions[name],
        connect: browser.runtime.connect,
        onConnect: browser.runtime.onConnect,
        paused: options.paused,
        debug: true,
    })
    rpcConnection.setup()

    return rpcConnection
}
