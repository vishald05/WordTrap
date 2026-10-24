import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
    validateNewPlayer,
    createPlayer,
    initializePassAndPlayGame,
    advanceRoleReveal,
    advanceSpeaker,
    startNextDiscussionRound,
    updateVoteCount,
    resolveVoteResults,
    startRematch
} from './gameLogic.js';
import { MIN_PLAYERS } from '../data/topics.js';

const PassAndPlayContext = createContext(null);

const INITIAL_STATE = {
    // Registered players in setup
    players: [],
    
    // Active game state once started
    gameState: null,
    
    // Error / notification toast
    notification: null,
    
    // Tie / revote modal state
    tieTransitionModal: null
};

function passAndPlayReducer(state, action) {
    switch (action.type) {
        case 'ADD_PLAYER': {
            const validation = validateNewPlayer(action.payload.name, state.players);
            if (!validation.valid) {
                return {
                    ...state,
                    notification: { type: 'error', message: validation.error }
                };
            }
            const newPlayer = createPlayer(validation.trimmedName);
            return {
                ...state,
                players: [...state.players, newPlayer],
                notification: null
            };
        }

        case 'REMOVE_PLAYER': {
            return {
                ...state,
                players: state.players.filter(p => p.id !== action.payload.id),
                notification: null
            };
        }

        case 'CLEAR_PLAYERS': {
            return {
                ...state,
                players: [],
                notification: null
            };
        }

        case 'START_GAME': {
            if (state.players.length < MIN_PLAYERS) {
                return {
                    ...state,
                    notification: {
                        type: 'error',
                        message: `At least ${MIN_PLAYERS} players are required to start (currently ${state.players.length}).`
                    }
                };
            }
            const newGame = initializePassAndPlayGame(state.players);
            return {
                ...state,
                gameState: newGame,
                notification: null,
                tieTransitionModal: null
            };
        }

        case 'REVEAL_ROLE': {
            if (!state.gameState || state.gameState.phase !== 'roleReveal') return state;
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    isRoleRevealed: true
                }
            };
        }

        case 'HIDE_AND_PASS': {
            if (!state.gameState || state.gameState.phase !== 'roleReveal') return state;
            const { currentViewerIndex, players } = state.gameState;
            const { nextViewerIndex, isComplete } = advanceRoleReveal(currentViewerIndex, players.length);

            if (isComplete) {
                // All players have viewed their role -> advance to discussion
                return {
                    ...state,
                    gameState: {
                        ...state.gameState,
                        phase: 'discussion',
                        currentViewerIndex: 0,
                        isRoleRevealed: false
                    }
                };
            }

            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    currentViewerIndex: nextViewerIndex,
                    isRoleRevealed: false
                }
            };
        }

        case 'NEXT_SPEAKER': {
            if (!state.gameState || state.gameState.phase !== 'discussion') return state;
            const { currentSpeakerIndex, speakingOrder } = state.gameState;
            const { nextSpeakerIndex, isComplete } = advanceSpeaker(currentSpeakerIndex, speakingOrder.length);

            if (isComplete) {
                // Final speaker finished -> advance to voting
                return {
                    ...state,
                    gameState: {
                        ...state.gameState,
                        phase: 'voting',
                        currentSpeakerIndex: 0,
                        roundTransitionMessage: null
                    }
                };
            }

            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    currentSpeakerIndex: nextSpeakerIndex
                }
            };
        }

        case 'UPDATE_VOTE': {
            if (!state.gameState || state.gameState.phase !== 'voting') return state;
            const { targetId, delta } = action.payload;
            const totalPlayers = state.gameState.players.length;

            const updated = updateVoteCount(
                state.gameState.voteCounts,
                state.gameState.skipVoteCount,
                totalPlayers,
                targetId,
                delta
            );

            if (!updated.changed) return state;

            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    voteCounts: updated.voteCounts,
                    skipVoteCount: updated.skipVoteCount
                }
            };
        }

        case 'SET_VOTING_REVIEW': {
            if (!state.gameState || state.gameState.phase !== 'voting') return state;
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    isVotingReviewOpen: action.payload.isOpen
                }
            };
        }

        case 'RESET_VOTES': {
            if (!state.gameState || state.gameState.phase !== 'voting') return state;
            const resetCounts = {};
            for (const p of state.gameState.players) {
                resetCounts[p.id] = 0;
            }
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    voteCounts: resetCounts,
                    skipVoteCount: 0,
                    isVotingReviewOpen: false
                }
            };
        }

        case 'CONFIRM_VOTES': {
            if (!state.gameState || state.gameState.phase !== 'voting') return state;
            const { voteCounts, skipVoteCount, players, imposterId, roundNumber } = state.gameState;

            const resolution = resolveVoteResults(
                voteCounts,
                skipVoteCount,
                players,
                imposterId,
                { roundNumber }
            );

            if (!resolution.success) {
                return {
                    ...state,
                    notification: { type: 'error', message: resolution.error }
                };
            }

            if (resolution.requiresNewDiscussion) {
                // Skip vote majority, 0 votes, or Round 1 tie -> Go for another discussion round
                const nextState = startNextDiscussionRound(state.gameState, resolution.message);
                return {
                    ...state,
                    gameState: nextState,
                    tieTransitionModal: {
                        title: resolution.isTie ? "It's a Tie!" : "No Elimination",
                        message: resolution.message,
                        nextRound: resolution.nextRound
                    },
                    notification: null
                };
            }

            // Game over with elimination
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    phase: 'results',
                    isVotingReviewOpen: false,
                    results: resolution
                },
                notification: null
            };
        }

        case 'DISMISS_TRANSITION_MODAL': {
            return {
                ...state,
                tieTransitionModal: null
            };
        }

        case 'PLAY_AGAIN': {
            if (!state.gameState) return state;
            const rematchState = startRematch(state.gameState);
            return {
                ...state,
                gameState: rematchState,
                notification: null,
                tieTransitionModal: null
            };
        }

        case 'RESET_TO_SETUP': {
            return {
                ...state,
                gameState: null,
                notification: null,
                tieTransitionModal: null
            };
        }

        case 'SET_NOTIFICATION': {
            return {
                ...state,
                notification: action.payload
            };
        }

        case 'CLEAR_NOTIFICATION': {
            return {
                ...state,
                notification: null
            };
        }

        case 'RESET_ALL': {
            return INITIAL_STATE;
        }

        default:
            return state;
    }
}

export function PassAndPlayProvider({ children, onExitToMenu }) {
    const [state, dispatch] = useReducer(passAndPlayReducer, INITIAL_STATE);

    // Auto-dismiss notification after 4 seconds
    useEffect(() => {
        if (!state.notification) return;
        const timer = setTimeout(() => {
            dispatch({ type: 'CLEAR_NOTIFICATION' });
        }, 4000);
        return () => clearTimeout(timer);
    }, [state.notification]);

    const value = {
        players: state.players,
        gameState: state.gameState,
        notification: state.notification,
        tieTransitionModal: state.tieTransitionModal,

        addPlayer: (name) => dispatch({ type: 'ADD_PLAYER', payload: { name } }),
        removePlayer: (id) => dispatch({ type: 'REMOVE_PLAYER', payload: { id } }),
        clearPlayers: () => dispatch({ type: 'CLEAR_PLAYERS' }),
        startGame: () => dispatch({ type: 'START_GAME' }),
        revealRole: () => dispatch({ type: 'REVEAL_ROLE' }),
        hideAndPass: () => dispatch({ type: 'HIDE_AND_PASS' }),
        nextSpeaker: () => dispatch({ type: 'NEXT_SPEAKER' }),
        updateVote: (targetId, delta) => dispatch({ type: 'UPDATE_VOTE', payload: { targetId, delta } }),
        setVotingReview: (isOpen) => dispatch({ type: 'SET_VOTING_REVIEW', payload: { isOpen } }),
        resetVotes: () => dispatch({ type: 'RESET_VOTES' }),
        confirmVotes: () => dispatch({ type: 'CONFIRM_VOTES' }),
        dismissTransitionModal: () => dispatch({ type: 'DISMISS_TRANSITION_MODAL' }),
        playAgain: () => dispatch({ type: 'PLAY_AGAIN' }),
        resetToSetup: () => dispatch({ type: 'RESET_TO_SETUP' }),
        clearNotification: () => dispatch({ type: 'CLEAR_NOTIFICATION' }),
        exitToMenu: () => {
            dispatch({ type: 'RESET_ALL' });
            if (onExitToMenu) onExitToMenu();
        }
    };

    return (
        <PassAndPlayContext.Provider value={value}>
            {children}
        </PassAndPlayContext.Provider>
    );
}

export function usePassAndPlay() {
    const context = useContext(PassAndPlayContext);
    if (!context) {
        throw new Error('usePassAndPlay must be used within a PassAndPlayProvider');
    }
    return context;
}
