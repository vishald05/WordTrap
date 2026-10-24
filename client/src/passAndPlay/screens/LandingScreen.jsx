import React from 'react';

/**
 * Landing Page & Game Mode Selection
 * Clearly distinguishes between Pass & Play (same device) and Online Multiplayer.
 */
export default function LandingScreen({ onSelectPassAndPlay, onSelectOnline }) {
    return (
        <div className="pap-landing-screen">
            <header className="pap-landing-header">
                <div className="pap-brand-mark">🕵️‍♂️</div>
                <h1 className="pap-brand-title">Word Trap</h1>
                <p className="pap-brand-subtitle">The Social Bluffing Party Game</p>
            </header>

            <main className="pap-mode-selection">
                {/* Mode 1: Pass & Play */}
                <div className="pap-mode-card pap-mode-featured">
                    <div className="pap-mode-badge pap-badge-primary">Local Group</div>
                    <h2 className="pap-mode-title">Pass & Play</h2>
                    <p className="pap-mode-desc">
                        Pass one phone around the circle. No room codes, internet, or accounts needed.
                    </p>
                    <ul className="pap-mode-perks">
                        <li><span>📱</span> One shared device</li>
                        <li><span>👥</span> 4 or more players</li>
                        <li><span>⚡</span> Instant local setup</li>
                    </ul>
                    <button
                        type="button"
                        className="pap-btn pap-btn-primary pap-btn-lg pap-mode-btn"
                        onClick={onSelectPassAndPlay}
                    >
                        Start Pass & Play
                    </button>
                </div>

                {/* Mode 2: Online Multiplayer */}
                <div className="pap-mode-card">
                    <div className="pap-mode-badge pap-badge-muted">Multi-Device</div>
                    <h2 className="pap-mode-title">Online Mode</h2>
                    <p className="pap-mode-desc">
                        Join or create a room with friends playing on their own phones or computers.
                    </p>
                    <ul className="pap-mode-perks">
                        <li><span>🌐</span> Play across devices</li>
                        <li><span>🔑</span> 6-letter room code</li>
                        <li><span>💬</span> Real-time chat & voting</li>
                    </ul>
                    <button
                        type="button"
                        className="pap-btn pap-btn-secondary pap-btn-lg pap-mode-btn"
                        onClick={onSelectOnline}
                    >
                        Play Online
                    </button>
                </div>
            </main>

            <footer className="pap-how-it-works">
                <h3 className="pap-how-title">How to Play Word Trap</h3>
                <div className="pap-how-steps">
                    <div className="pap-how-step">
                        <span className="pap-step-num">1</span>
                        <p>One player is secretly the <strong>imposter</strong>.</p>
                    </div>
                    <div className="pap-how-step">
                        <span className="pap-step-num">2</span>
                        <p>Regular players see the <strong>secret word</strong> and topic. Imposter sees only the topic.</p>
                    </div>
                    <div className="pap-how-step">
                        <span className="pap-step-num">3</span>
                        <p>Take turns giving <strong>verbal clues</strong> without giving the word away.</p>
                    </div>
                    <div className="pap-how-step">
                        <span className="pap-step-num">4</span>
                        <p>Vote as a group to <strong>trap the imposter</strong>!</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
