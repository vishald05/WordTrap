/**
 * Main App Component
 * 
 * Top-level mode controller:
 * - Landing Page: choose between Pass & Play (same device) and Online Multiplayer
 * - Pass & Play: entirely local, phone-friendly game flow
 * - Online: existing server-authoritative multiplayer flow
 */

import React, { useState } from 'react';
import { useGame } from './GameContext';
import GameLayout from './components/GameLayout';
import TieTransition from './components/TieTransition';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import RoleReveal from './pages/RoleReveal';
import DescriptionPhase from './pages/DescriptionPhase';
import VotingPhase from './pages/VotingPhase';
import Results from './pages/Results';
import PostGame from './pages/PostGame';

import LandingScreen from './passAndPlay/screens/LandingScreen';
import { PassAndPlayProvider } from './passAndPlay/PassAndPlayContext';
import PassAndPlayApp from './passAndPlay/PassAndPlayApp';

import './App.css';

export default function App() {
    const { room, phase } = useGame();
    // Mode state: null (landing), 'passAndPlay', 'online'
    const [selectedMode, setSelectedMode] = useState(null);

    // If an online room is active, force online mode
    const mode = room ? 'online' : selectedMode;

    // Render Landing Page if no mode is selected
    if (!mode) {
        return (
            <div className="app">
                <div className="container">
                    <LandingScreen
                        onSelectPassAndPlay={() => setSelectedMode('passAndPlay')}
                        onSelectOnline={() => setSelectedMode('online')}
                    />
                </div>
            </div>
        );
    }

    // Render Pass & Play
    if (mode === 'passAndPlay') {
        return (
            <div className="app pap-mode-active">
                <PassAndPlayProvider onExitToMenu={() => setSelectedMode(null)}>
                    <PassAndPlayApp />
                </PassAndPlayProvider>
            </div>
        );
    }

    // Otherwise, render existing Online Multiplayer flow
    const renderOnlinePage = () => {
        if (!room) {
            return <Home onBackToLanding={() => setSelectedMode(null)} />;
        }

        switch (phase) {
            case 'lobby':
                return <Lobby />;
            case 'roleReveal':
                return <RoleReveal />;
            case 'description':
                return <DescriptionPhase />;
            case 'voting':
                return <VotingPhase />;
            case 'results':
                return <Results />;
            case 'postGame':
                return <PostGame />;
            default:
                return <Home onBackToLanding={() => setSelectedMode(null)} />;
        }
    };

    const isGamePhase = room && ['roleReveal', 'description', 'voting', 'results', 'postGame'].includes(phase);

    return (
        <div className="app">
            {/* V1.3: Tie transition overlay - shows on top of everything in online mode */}
            <TieTransition />
            
            <div className="container">
                {isGamePhase ? (
                    <GameLayout>
                        {renderOnlinePage()}
                    </GameLayout>
                ) : (
                    renderOnlinePage()
                )}
            </div>
        </div>
    );
}
