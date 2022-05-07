import 'core-js'
import React from 'react'
import ReactDOM from 'react-dom'
import Popup from './container'
import { setupRpcConnection } from 'src/util/webextensionRPC'
import { providers } from 'ethers'
import { CHAIN_ID, INFURA_ID, IS_MAINNET, POLYGON_MUMBAI } from './constants'
import { createClient, Provider as WAGMIProvider, defaultChains } from 'wagmi'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

setupRpcConnection({ sideName: 'content-script-popup', role: 'content' })

// Get environment variables
// const infuraId = process.env.NEXT_PUBLIC_INFURA_ID as string
const chains = defaultChains
const supportedChains = IS_MAINNET ? [POLYGON_MUMBAI] : [POLYGON_MUMBAI]
const defaultChain = IS_MAINNET ? POLYGON_MUMBAI : POLYGON_MUMBAI

type ConnectorsConfig = { chainId?: number }

const connectors = ({ chainId }: ConnectorsConfig) => {
    const rpcUrl =
        supportedChains.find((x) => x.id === chainId)?.rpcUrls?.default?.[0] ??
        defaultChain.rpcUrls.default[0]

    return [
        new InjectedConnector({
            chains,
            options: { shimDisconnect: true },
        }),
        new WalletConnectConnector({
            options: {
                infuraId: INFURA_ID,
                chainId: CHAIN_ID,
            },
        }),
        new CoinbaseWalletConnector({
            options: {
                appName: 'Wagmi',
                jsonRpcUrl: `${rpcUrl}/${INFURA_ID}`,
            },
        }),
    ]
}

const wagmiClient = createClient({
    autoConnect: true,
    provider(config) {
        return new providers.InfuraProvider(config.chainId, INFURA_ID)
    },
    connectors,
})

document.getElementById('loader').remove()

ReactDOM.render(
    <WAGMIProvider client={wagmiClient}>
        <Popup />
    </WAGMIProvider>,
    document.getElementById('app'),
)
