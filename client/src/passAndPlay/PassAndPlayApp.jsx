import React, { useState } from 'react';
import { usePassAndPlay } from './PassAndPlayContext.jsx';
import PlayerSetupScreen from './screens/PlayerSetupScreen.jsx';
import RoleRevealScreen from './screens/RoleRevealScreen.jsx';
import DiscussionScreen from './screens/DiscussionScreen.jsx';
import VotingScreen from './screens/VotingScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import './passAndPlay.css';

export default function PassAndPlayApp() {
    const { gameState, tieTransitionModal, dismissTransitionModal, exitToMenu } = usePassAndPlay();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // If game has started and is not on results, require confirmation before exiting
    const handleExitRequest = () => {
        if (gameState && gameState.phase !== 'results') {
            setShowExitConfirm(true);
        } else {
            exitToMenu();
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        exitToMenu();
    };

    const renderScreen = () => {
        if (!gameState) {
            return <PlayerSetupScreen />;
        }

        switch (gameState.phase) {
            case 'roleReveal':
                return <RoleRevealScreen />;
            case 'discussion':
                return <DiscussionScreen />;
            case 'voting':
                return <VotingScreen />;
            case 'results':
                return <ResultsScreen />;
            default:
                return <PlayerSetupScreen />;
        }
    };

    return (
        <div className="pap-app-root">
            {/* Top Navigation bar (only when game is active) */}
            {gameState && (
                <header className="pap-global-topbar">
                    <button
                        type="button"
                        className="pap-topbar-exit-btn"
                        onClick={handleExitRequest}
                        aria-label="Exit current game"
                    >
                        ✕ Exit Game
                    </button>
                    <span className="pap-topbar-brand">Word Trap — Pass & Play</span>
                </header>
            )}

            {/* Current Phase Screen */}
            <main className="pap-main-container">
                {renderScreen()}
            </main>

            {/* Tie / Skip Vote Round Transition Modal */}
            {tieTransitionModal && (
                <div className="pap-modal-overlay pap-transition-overlay" role="dialog" aria-modal="true">
                    <div className="pap-transition-content">
                        <div className="pap-transition-icon">⚖️</div>
                        <h2 className="pap-transition-title">{tieTransitionModal.title}</h2>
                        <p className="pap-transition-message">{tieTransitionModal.message}</p>
                        <p className="pap-transition-hint">
                            Roles and secret word remain unchanged. Round {tieTransitionModal.nextRound} begins now.
                        </p>
                        <button
                            type="button"
                            className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block pap-transition-btn"
                            onClick={dismissTransitionModal}
                        >
                            Start Round {tieTransitionModal.nextRound} Discussion →
                        </button>
                    </div>
                </div>
            )}

            {/* Mid-Game Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="pap-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
                    <div className="pap-modal-dialog">
                        <h2 id="exit-modal-title" className="pap-modal-title">
                            Quit Current Game?
                        </h2>
                        <p className="pap-modal-subtitle">
                            Are you sure you want to exit? Your current game progress will be lost.
                        </p>
                        <div className="pap-modal-buttons">
                            <button
                                type="button"
                                className="pap-btn pap-btn-secondary"
                                onClick={() => setShowExitConfirm(false)}
                            >
                                Keep Playing
                            </button>
                            <button
                                type="button"
                                className="pap-btn pap-btn-danger"
                                onClick={confirmExit}
                            >
                                Exit to Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
