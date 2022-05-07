import React from 'react'
import styled from 'styled-components'

import { useAccount } from 'wagmi'

import SignIn from './components/ConnectedAccount'
const styles = require('./components/Popup.css')

const PopupContainer = (props) => {
    const { data: accountData } = useAccount()

    const isSignedIn = !!accountData

    return (
        <div className={styles.popup}>
            <PopupContainerContainer>
                <FeedActivitySection>
                    {isSignedIn ? (
                        <ButtonContainer>
                            <div
                                style={{
                                    cursor: 'pointer',
                                    border: '1px solid #e6e6e6',
                                    padding: '6px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    color: '#3b3b3b',
                                    verticalAlign: 'middle',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        marginRight: '4px',
                                    }}
                                >
                                    0x644...2582
                                </span>
                                <img
                                    style={{
                                        verticalAlign: 'middle',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                    }}
                                    src={`https://avatar.tobi.sh/jamal.png`}
                                    alt="avatar"
                                />
                            </div>
                        </ButtonContainer>
                    ) : (
                        <SignIn />
                    )}
                </FeedActivitySection>
            </PopupContainerContainer>
        </div>
    )
}

const PopupContainerContainer = styled.div`
    padding-bottom: 10px;
`

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
`

const FeedActivitySection = styled.div`
    width: fill-available;
    display: flex;
    justify-content: space-between;
    height: 50px;
    align-items: center;
    padding: 10px 20px 0px 24px;
    grid-auto-flow: column;
`

export default PopupContainer
