// import { isOnboarded } from 'utils/api';
import { CHAIN_ID, ERROR_MESSAGE } from '../constants'
import {
    Connector,
    useAccount,
    useConnect,
    useNetwork,
    useSignMessage,
} from 'wagmi'
import React, { useState, useEffect } from 'react'

const SignIn = () => {
    const [mounted, setMounted] = useState(false)
    const { activeChain } = useNetwork()
    const { signMessageAsync, isLoading: signLoading } = useSignMessage()
    const { connectors, error, connectAsync } = useConnect()
    const { data: accountData } = useAccount()
    useEffect(() => setMounted(true), [])

    const onConnect = async (x: Connector) => {
        await connectAsync(x).then(({ account }) => {
            if (account) {
                console.log(account)
            }
        })
    }

    return (
        <div className="inline-block overflow-hidden space-y-3 w-full text-left align-middle transition-all transform">
            {connectors.map((x) => {
                return (
                    <button
                        type="button"
                        key={x.id}
                        onClick={() => onConnect(x)}
                        disabled={
                            mounted
                                ? !x.ready ||
                                  x.id === accountData?.connector?.id
                                : false
                        }
                    >
                        <span className="flex justify-between items-center w-full">
                            {mounted
                                ? x.id === 'injected'
                                    ? 'Browser Wallet'
                                    : x.name
                                : x.name}
                            {mounted ? !x.ready && ' (unsupported)' : ''}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default SignIn
