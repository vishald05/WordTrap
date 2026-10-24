import React from 'react';
import { usePassAndPlay } from '../PassAndPlayContext.jsx';

export default function ResultsScreen() {
    const { gameState, playAgain, resetToSetup, exitToMenu } = usePassAndPlay();

    if (!gameState || !gameState.results) return null;

    const {
        topic,
        secretWord,
        results
    } = gameState;

    const {
        eliminatedPlayer,
        eliminatedRole,
        imposter,
        playersWin,
        reason,
        voteSummary,
        skipVoteCount
    } = results;

    return (
        <div className="pap-screen pap-results-screen">
            <header className="pap-screen-header">
                <span className="pap-phase-badge">Game Results</span>
            </header>

            {/* Main Outcome Banner */}
            <div className={`pap-outcome-banner ${playersWin ? 'pap-outcome-players-win' : 'pap-outcome-imposter-wins'}`}>
                <span className="pap-outcome-icon">{playersWin ? '🎉' : '🕵️‍♂️'}</span>
                <h1 className="pap-outcome-title">
                    {playersWin ? 'Regular Players Win!' : 'Imposter Wins!'}
                </h1>
                <p className="pap-outcome-story">{reason}</p>
            </div>

            {/* Eliminated Player Card (if eliminated) */}
            {eliminatedPlayer ? (
                <div className="pap-results-card pap-eliminated-card">
                    <span className="pap-card-eyebrow">Player Eliminated</span>
                    <h2 className="pap-eliminated-name">{eliminatedPlayer.name}</h2>
                    <span className={`pap-eliminated-role-tag ${eliminatedRole === 'imposter' ? 'pap-tag-imposter' : 'pap-tag-regular'}`}>
                        {eliminatedRole === 'imposter' ? '🕵️ Was The Imposter!' : '👥 Was An Innocent Regular Player'}
                    </span>
                </div>
            ) : (
                <div className="pap-results-card pap-no-elimination-card">
                    <span className="pap-card-eyebrow">Elimination Outcome</span>
                    <h2 className="pap-eliminated-name">No Player Eliminated</h2>
                    <p className="pap-card-desc">The imposter survived and escaped undetected!</p>
                </div>
            )}

            {/* Secret Reveal Card */}
            <div className="pap-results-card pap-reveal-summary-card">
                <h3 className="pap-card-heading">The Secret Information</h3>
                <div className="pap-secret-reveal-grid">
                    <div className="pap-reveal-item">
                        <span className="pap-label">Actual Imposter</span>
                        <strong className="pap-reveal-val pap-val-imposter">{imposter?.name}</strong>
                    </div>
                    <div className="pap-reveal-item">
                        <span className="pap-label">Topic</span>
                        <strong className="pap-reveal-val">{topic}</strong>
                    </div>
                    <div className="pap-reveal-item pap-reveal-item-full">
                        <span className="pap-label">Secret Word</span>
                        <strong className="pap-reveal-val pap-val-word">{secretWord}</strong>
                    </div>
                </div>
            </div>

            {/* Vote Breakdown Summary */}
            <div className="pap-results-card pap-vote-summary-card">
                <h3 className="pap-card-heading">Final Vote Breakdown</h3>
                <ul className="pap-vote-summary-list">
                    {voteSummary?.map((entry) => {
                        const isEliminated = eliminatedPlayer && entry.playerId === eliminatedPlayer.id;
                        const isTheImposter = imposter && entry.playerId === imposter.id;

                        return (
                            <li
                                key={entry.playerId}
                                className={`pap-summary-row ${isEliminated ? 'pap-row-eliminated' : ''}`}
                            >
                                <div className="pap-summary-player">
                                    <span className="pap-summary-player-name">{entry.playerName}</span>
                                    {isTheImposter && (
                                        <span className="pap-mini-badge pap-badge-imposter">Imposter</span>
                                    )}
                                    {isEliminated && (
                                        <span className="pap-mini-badge pap-badge-eliminated">Eliminated</span>
                                    )}
                                </div>
                                <span className="pap-summary-votes-count">
                                    {entry.votes} vote{entry.votes !== 1 ? 's' : ''}
                                </span>
                            </li>
                        );
                    })}
                    {typeof skipVoteCount === 'number' && skipVoteCount > 0 && (
                        <li className="pap-summary-row pap-summary-skip-row">
                            <span className="pap-summary-player-name">Skip Vote (Abstain)</span>
                            <span className="pap-summary-votes-count">
                                {skipVoteCount} vote{skipVoteCount !== 1 ? 's' : ''}
                            </span>
                        </li>
                    )}
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="pap-results-actions">
                <button
                    type="button"
                    className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block"
                    onClick={playAgain}
                >
                    🔄 Play Again (Same Players)
                </button>
                <div className="pap-results-secondary-actions">
                    <button
                        type="button"
                        className="pap-btn pap-btn-secondary"
                        onClick={resetToSetup}
                    >
                        Edit Player List
                    </button>
                    <button
                        type="button"
                        className="pap-btn pap-btn-secondary"
                        onClick={exitToMenu}
                    >
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
}
