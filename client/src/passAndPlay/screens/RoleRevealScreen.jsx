import React from 'react';
import { usePassAndPlay } from '../PassAndPlayContext.jsx';

export default function RoleRevealScreen() {
    const { gameState, revealRole, hideAndPass } = usePassAndPlay();

    if (!gameState) return null;

    const {
        players,
        currentViewerIndex,
        isRoleRevealed,
        imposterId,
        topic,
        secretWord
    } = gameState;

    const currentViewer = players[currentViewerIndex];
    const isImposter = currentViewer.id === imposterId;
    const isLastPlayer = currentViewerIndex === players.length - 1;
    const nextViewer = !isLastPlayer ? players[currentViewerIndex + 1] : null;

    return (
        <div className="pap-screen pap-reveal-screen">
            {/* Header info */}
            <header className="pap-screen-header">
                <span className="pap-phase-badge">Phase 1: Secret Role</span>
                <span className="pap-player-progress">
                    Player {currentViewerIndex + 1} of {players.length}
                </span>
            </header>

            {!isRoleRevealed ? (
                /* Card Hidden — Waiting for current viewer */
                <div className="pap-hand-off-card">
                    <div className="pap-privacy-shield">🔒</div>
                    <p className="pap-hand-off-instruction">Hand device to</p>
                    <h1 className="pap-hand-off-name">{currentViewer.name}</h1>
                    <p className="pap-privacy-notice">
                        Make sure nobody else is looking at this screen before revealing your role.
                    </p>

                    <button
                        type="button"
                        className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block pap-reveal-trigger-btn"
                        onClick={revealRole}
                    >
                        I'm Ready — Reveal My Role
                    </button>
                </div>
            ) : (
                /* Card Revealed — Private view */
                <div className="pap-secret-card-container">
                    <div className={`pap-secret-card ${isImposter ? 'pap-card-imposter' : 'pap-card-regular'}`}>
                        <div className="pap-card-role-header">
                            <span className="pap-card-role-pill">
                                {isImposter ? '🕵️‍♂️ Imposter' : '👥 Regular Player'}
                            </span>
                            <h2 className="pap-card-player-name">{currentViewer.name}</h2>
                        </div>

                        <div className="pap-card-topic-section">
                            <span className="pap-label">Topic</span>
                            <strong className="pap-topic-val">{topic}</strong>
                        </div>

                        {isImposter ? (
                            <div className="pap-card-imposter-content">
                                <div className="pap-secret-banner pap-imposter-banner">
                                    <span className="pap-banner-icon">🤫</span>
                                    <p className="pap-banner-headline">You are the Imposter!</p>
                                    <p className="pap-banner-subtext">
                                        You do <strong>not</strong> know the secret word.
                                    </p>
                                </div>
                                <div className="pap-role-tips">
                                    <p><strong>Your Goal:</strong></p>
                                    <p>Listen closely to other players' clues and give vague, convincing clues to blend in!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="pap-card-regular-content">
                                <div className="pap-secret-word-box">
                                    <span className="pap-label">Your Secret Word</span>
                                    <strong className="pap-word-val">{secretWord}</strong>
                                </div>
                                <div className="pap-role-tips">
                                    <p><strong>Your Goal:</strong></p>
                                    <p>Describe this word subtly without saying it directly, so regular players recognize you and the imposter stays confused.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pap-sticky-bottom">
                        <button
                            type="button"
                            className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block pap-hide-role-btn"
                            onClick={hideAndPass}
                        >
                            {isLastPlayer
                                ? 'Hide Role & Start Discussion →'
                                : `Hide & Pass to ${nextViewer?.name} →`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
