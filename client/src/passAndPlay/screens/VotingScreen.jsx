import React, { useState } from 'react';
import { usePassAndPlay } from '../PassAndPlayContext.jsx';
import { getTotalRecordedVotes } from '../gameLogic.js';

export default function VotingScreen() {
    const {
        gameState,
        updateVote,
        resetVotes,
        confirmVotes,
        notification
    } = usePassAndPlay();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    if (!gameState) return null;

    const {
        players,
        voteCounts,
        skipVoteCount,
        roundNumber
    } = gameState;

    const totalPlayers = players.length;
    const recordedTotal = getTotalRecordedVotes(voteCounts, skipVoteCount);
    const isComplete = recordedTotal === totalPlayers;
    const remainingVotes = totalPlayers - recordedTotal;

    const handleConfirmClick = () => {
        if (!isComplete) return;
        setIsConfirmModalOpen(true);
    };

    const handleFinalConfirm = () => {
        setIsConfirmModalOpen(false);
        confirmVotes();
    };

    return (
        <div className="pap-screen pap-voting-screen">
            <header className="pap-screen-header">
                <span className="pap-phase-badge">Phase 3: Group Voting</span>
                <span className="pap-round-indicator">Round {roundNumber}</span>
            </header>

            <div className="pap-voting-hero">
                <h1 className="pap-title">Record Announced Votes</h1>
                <p className="pap-subtitle">
                    Players announce their votes aloud. The device holder records each vote below.
                </p>

                {/* Progress / Status Tracker */}
                <div className={`pap-vote-counter-card ${isComplete ? 'pap-counter-complete' : ''}`}>
                    <div className="pap-counter-main">
                        <span className="pap-counter-label">Votes Recorded</span>
                        <strong className="pap-counter-numbers">
                            {recordedTotal} <span className="pap-counter-max">/ {totalPlayers}</span>
                        </strong>
                    </div>
                    <div className="pap-progress-bar-track">
                        <div
                            className="pap-progress-bar-fill"
                            style={{ width: `${(recordedTotal / totalPlayers) * 100}%` }}
                        />
                    </div>
                    <span className="pap-counter-subtext">
                        {isComplete
                            ? 'All votes recorded! Ready to confirm results.'
                            : `Waiting for ${remainingVotes} more vote${remainingVotes === 1 ? '' : 's'}.`}
                    </span>
                </div>
            </div>

            {notification && notification.type === 'error' && (
                <div className="pap-alert pap-alert-error" role="alert">
                    <span>⚠️</span>
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Voting List */}
            <div className="pap-vote-rows-container">
                <div className="pap-vote-list-header">
                    <span>Players</span>
                    <span>Vote Count</span>
                </div>

                <div className="pap-vote-list">
                    {players.map((p) => {
                        const count = voteCounts[p.id] || 0;
                        const canDecrement = count > 0;
                        const canIncrement = recordedTotal < totalPlayers;

                        return (
                            <div key={p.id} className={`pap-vote-row ${count > 0 ? 'pap-row-has-votes' : ''}`}>
                                <div className="pap-vote-player-info">
                                    <span className="pap-vote-player-name" title={p.name}>
                                        {p.name}
                                    </span>
                                </div>

                                <div className="pap-vote-stepper">
                                    <button
                                        type="button"
                                        className="pap-stepper-btn pap-stepper-dec"
                                        disabled={!canDecrement}
                                        onClick={() => updateVote(p.id, -1)}
                                        aria-label={`Decrease vote count for ${p.name}`}
                                    >
                                        −
                                    </button>
                                    <span className="pap-stepper-value" aria-live="polite">
                                        {count}
                                    </span>
                                    <button
                                        type="button"
                                        className="pap-stepper-btn pap-stepper-inc"
                                        disabled={!canIncrement}
                                        onClick={() => updateVote(p.id, 1)}
                                        aria-label={`Increase vote count for ${p.name}`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Skip Vote Row */}
                    <div className={`pap-vote-row pap-vote-skip-row ${skipVoteCount > 0 ? 'pap-row-has-votes' : ''}`}>
                        <div className="pap-vote-player-info">
                            <span className="pap-vote-player-name pap-skip-name">
                                ⏩ Skip Vote (Abstain)
                            </span>
                            <span className="pap-vote-hint-small">More than 50% skips elimination</span>
                        </div>

                        <div className="pap-vote-stepper">
                            <button
                                type="button"
                                className="pap-stepper-btn pap-stepper-dec"
                                disabled={skipVoteCount <= 0}
                                onClick={() => updateVote('skip', -1)}
                                aria-label="Decrease Skip Vote count"
                            >
                                −
                            </button>
                            <span className="pap-stepper-value" aria-live="polite">
                                {skipVoteCount}
                            </span>
                            <button
                                type="button"
                                className="pap-stepper-btn pap-stepper-inc"
                                disabled={recordedTotal >= totalPlayers}
                                onClick={() => updateVote('skip', 1)}
                                aria-label="Increase Skip Vote count"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pap-vote-reset-row">
                    <button
                        type="button"
                        className="pap-btn-text-danger"
                        disabled={recordedTotal === 0}
                        onClick={resetVotes}
                    >
                        ↺ Reset all vote counts to zero
                    </button>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="pap-sticky-bottom">
                {!isComplete && (
                    <p className="pap-requirement-hint">
                        {remainingVotes} more announced vote{remainingVotes === 1 ? '' : 's'} must be recorded.
                    </p>
                )}
                <button
                    type="button"
                    className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block pap-confirm-results-btn"
                    disabled={!isComplete}
                    onClick={handleConfirmClick}
                >
                    Confirm Results ({recordedTotal}/{totalPlayers})
                </button>
            </div>

            {/* Review & Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="pap-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
                    <div className="pap-modal-dialog">
                        <h2 id="confirm-modal-title" className="pap-modal-title">
                            Confirm Group Votes
                        </h2>
                        <p className="pap-modal-subtitle">
                            Please verify the recorded totals with the group before proceeding:
                        </p>

                        <div className="pap-confirmation-summary">
                            <ul className="pap-summary-list">
                                {players.map(p => (
                                    <li key={p.id} className="pap-summary-item">
                                        <span className="pap-summary-name">{p.name}</span>
                                        <span className="pap-summary-count">
                                            {voteCounts[p.id] || 0} vote{(voteCounts[p.id] || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </li>
                                ))}
                                <li className="pap-summary-item pap-summary-skip-item">
                                    <span className="pap-summary-name">Skip Vote (Abstain)</span>
                                    <span className="pap-summary-count">
                                        {skipVoteCount} vote{skipVoteCount !== 1 ? 's' : ''}
                                    </span>
                                </li>
                            </ul>
                            <div className="pap-summary-total-row">
                                <strong>Total Votes:</strong>
                                <strong>{recordedTotal} / {totalPlayers}</strong>
                            </div>
                        </div>

                        <div className="pap-modal-buttons">
                            <button
                                type="button"
                                className="pap-btn pap-btn-secondary"
                                onClick={() => setIsConfirmModalOpen(false)}
                            >
                                ← Edit Votes
                            </button>
                            <button
                                type="button"
                                className="pap-btn pap-btn-primary"
                                onClick={handleFinalConfirm}
                            >
                                Confirm & Reveal →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
