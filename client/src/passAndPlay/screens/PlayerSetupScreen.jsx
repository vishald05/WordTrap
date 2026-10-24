import React, { useState } from 'react';
import { usePassAndPlay } from '../PassAndPlayContext.jsx';
import { MIN_PLAYERS } from '../../data/topics.js';

export default function PlayerSetupScreen() {
    const { players, addPlayer, removePlayer, startGame, notification, exitToMenu } = usePassAndPlay();
    const [nameInput, setNameInput] = useState('');
    const [localError, setLocalError] = useState('');

    const handleAdd = (e) => {
        if (e) e.preventDefault();
        setLocalError('');
        const trimmed = nameInput.trim();

        if (!trimmed) {
            setLocalError('Please enter a player name.');
            return;
        }

        // Check duplicate locally for immediate responsive feedback
        const isDup = players.some(p => p.name.trim().toLowerCase() === trimmed.toLowerCase());
        if (isDup) {
            setLocalError(`A player named "${trimmed}" has already joined.`);
            return;
        }

        addPlayer(nameInput);
        setNameInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAdd(e);
        }
    };

    const count = players.length;
    const canStart = count >= MIN_PLAYERS;

    return (
        <div className="pap-screen pap-setup-screen">
            <header className="pap-screen-header">
                <button
                    type="button"
                    className="pap-back-btn"
                    onClick={exitToMenu}
                    aria-label="Back to main menu"
                >
                    ← Menu
                </button>
                <div className="pap-header-titles">
                    <h1 className="pap-title">Player Setup</h1>
                    <p className="pap-subtitle">Add players in the order they will pass the device</p>
                </div>
            </header>

            {(localError || (notification && notification.type === 'error')) && (
                <div className="pap-alert pap-alert-error" role="alert">
                    <span>⚠️</span>
                    <span>{localError || notification.message}</span>
                </div>
            )}

            {/* Player Input Form */}
            <form className="pap-player-input-card" onSubmit={handleAdd}>
                <label htmlFor="player-name-input" className="pap-field-label">
                    Add Player Name
                </label>
                <div className="pap-input-action-row">
                    <input
                        id="player-name-input"
                        type="text"
                        className="pap-input"
                        value={nameInput}
                        onChange={(e) => {
                            setNameInput(e.target.value);
                            if (localError) setLocalError('');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. Alice"
                        maxLength={20}
                        autoComplete="off"
                        autoCapitalize="words"
                    />
                    <button
                        type="submit"
                        className="pap-btn pap-btn-primary"
                        disabled={!nameInput.trim()}
                    >
                        + Add
                    </button>
                </div>
            </form>

            {/* Registered Players List */}
            <section className="pap-players-section">
                <div className="pap-players-header">
                    <h2 className="pap-section-title">
                        Players ({count})
                    </h2>
                    <span className={`pap-counter-badge ${canStart ? 'pap-badge-ready' : 'pap-badge-pending'}`}>
                        {canStart ? 'Ready to play' : `${MIN_PLAYERS - count} more needed`}
                    </span>
                </div>

                {players.length === 0 ? (
                    <div className="pap-empty-state">
                        <p className="pap-empty-icon">👥</p>
                        <p className="pap-empty-text">No players added yet.</p>
                        <p className="pap-empty-hint">Add at least {MIN_PLAYERS} players to start the game.</p>
                    </div>
                ) : (
                    <ol className="pap-player-list">
                        {players.map((p, index) => (
                            <li key={p.id} className="pap-player-item">
                                <span className="pap-player-num">{index + 1}</span>
                                <span className="pap-player-name" title={p.name}>
                                    {p.name}
                                </span>
                                <button
                                    type="button"
                                    className="pap-remove-btn"
                                    onClick={() => removePlayer(p.id)}
                                    aria-label={`Remove ${p.name}`}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            {/* Bottom Sticky Action Area */}
            <div className="pap-sticky-bottom">
                {!canStart && (
                    <p className="pap-requirement-hint">
                        Word Trap requires at least {MIN_PLAYERS} players ({count}/{MIN_PLAYERS}).
                    </p>
                )}
                <button
                    type="button"
                    className="pap-btn pap-btn-primary pap-btn-lg pap-btn-block"
                    disabled={!canStart}
                    onClick={startGame}
                >
                    Start Game ({count} Players)
                </button>
            </div>
        </div>
    );
}
