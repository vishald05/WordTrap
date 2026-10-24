import React from 'react';
import { usePassAndPlay } from '../PassAndPlayContext.jsx';

export default function DiscussionScreen() {
    const { gameState, nextSpeaker } = usePassAndPlay();

    if (!gameState) return null;

    const {
        players,
        roundNumber,
        speakingOrder,
        currentSpeakerIndex,
        roundTransitionMessage
    } = gameState;

    const totalSpeakers = speakingOrder.length;
    const currentSpeakerId = speakingOrder[currentSpeakerIndex];
    const currentSpeaker = players.find(p => p.id === currentSpeakerId);
    const isLastSpeaker = currentSpeakerIndex === totalSpeakers - 1;
    const nextSpeakerId = !isLastSpeaker ? speakingOrder[currentSpeakerIndex + 1] : null;
    const nextSpeakerPlayer = nextSpeakerId ? players.find(p => p.id === nextSpeakerId) : null;

    return (
        <div className="pap-screen pap-discussion-screen">
            <header className="pap-screen-header">
                <span className="pap-phase-badge">Phase 2: Discussion</span>
                <span className="pap-round-indicator">Round {roundNumber}</span>
            </header>

            {roundTransitionMessage && (
                <div className="pap-alert pap-alert-info" role="status">
                    <span>⚖️</span>
                    <span>{roundTransitionMessage}</span>
                </div>
            )}

            <div className="pap-turn-counter">
                Turn {currentSpeakerIndex + 1} of {totalSpeakers}
            </div>

            {/* Prominent Current Speaker Card */}
            <div className="pap-speaker-card">
                <div className="pap-speaker-avatar-circle">
                    🗣️
                </div>
                <span className="pap-speaker-tag">Current Speaker</span>
                <h1 className="pap-speaker-name" title={currentSpeaker?.name}>
                    {currentSpeaker?.name}
                </h1>

                <div className="pap-speaker-instructions">
                    <p className="pap-instruction-main">
                        Describe the secret word aloud in one sentence or clue.
                    </p>
                    <p className="pap-instruction-sub">
                        Do <strong>not</strong> say the exact word. If you are the imposter, bluff carefully!
                    </p>
                </div>
            </div>

            {/* Next Speaker Preview */}
            <div className="pap-upcoming-preview">
                {nextSpeakerPlayer ? (
                    <p>Next up: <strong>{nextSpeakerPlayer.name}</strong></p>
                ) : (
                    <p>🎯 <em>Final speaker of this round! Voting begins next.</em></p>
                )}
            </div>

            {/* Speaking Order Mini-Pills */}
            <div className="pap-order-pills-row" aria-label="Speaking order progress">
                {speakingOrder.map((id, index) => {
                    const p = players.find(pl => pl.id === id);
                    const isCurrent = index === currentSpeakerIndex;
                    const isDone = index < currentSpeakerIndex;
                    return (
                        <div
                            key={id}
                            className={`pap-order-pill ${isCurrent ? 'pap-pill-current' : ''} ${isDone ? 'pap-pill-done' : ''}`}
                            title={p?.name}
                        >
                            <span className="pap-pill-index">{index + 1}</span>
                            <span className="pap-pill-name">{p?.name}</span>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Action */}
            <div className="pap-sticky-bottom">
                <button
                    type="button"
                    className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block pap-speaker-advance-btn"
                    onClick={nextSpeaker}
                >
                    {isLastSpeaker ? 'Proceed to Group Voting →' : 'Next Player →'}
                </button>
            </div>
        </div>
    );
}
