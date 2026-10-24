/**
 * Pass & Play Core Game Logic
 * Pure functions for player setup, role assignment, discussion turns,
 * aggregate vote counting, vote resolution, and rematches.
 */

import { getRandomTopicAndWord, MIN_PLAYERS } from '../data/topics.js';

/**
 * Fisher-Yates unbiased shuffle algorithm.
 * Does not mutate the input array.
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Validates a new player name before adding to setup.
 * - Trims whitespace
 * - Disallows empty or whitespace-only names
 * - Disallows case-insensitive duplicates
 * 
 * @param {string} name 
 * @param {{ id: string, name: string }[]} existingPlayers 
 * @returns {{ valid: boolean, error?: string, trimmedName?: string }}
 */
export function validateNewPlayer(name, existingPlayers = []) {
    if (typeof name !== 'string') {
        return { valid: false, error: 'Name must be a valid text string.' };
    }

    const trimmed = name.trim();
    if (!trimmed) {
        return { valid: false, error: 'Player name cannot be empty.' };
    }

    if (trimmed.length > 20) {
        return { valid: false, error: 'Player name cannot exceed 20 characters.' };
    }

    const lower = trimmed.toLowerCase();
    const isDuplicate = existingPlayers.some(p => p.name.trim().toLowerCase() === lower);
    if (isDuplicate) {
        return { valid: false, error: `A player named "${trimmed}" already exists.` };
    }

    return { valid: true, trimmedName: trimmed };
}

/**
 * Creates a player object with a stable unique ID.
 * @param {string} trimmedName 
 * @param {string} [customId]
 * @returns {{ id: string, name: string }}
 */
export function createPlayer(trimmedName, customId) {
    const id = customId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
        id,
        name: trimmedName
    };
}

/**
 * Initializes a new Pass & Play game state from registered players.
 * Preserves player registration order while randomly selecting exactly one imposter.
 * 
 * @param {{ id: string, name: string }[]} players 
 * @param {Object} [overrides] - Optional overrides for deterministic testing (e.g. forced imposter, topic, word)
 * @returns {Object} Fresh game state
 */
export function initializePassAndPlayGame(players, overrides = {}) {
    if (!players || players.length < MIN_PLAYERS) {
        throw new Error(`At least ${MIN_PLAYERS} players are required to start.`);
    }

    // Select topic and word (or use overrides for testing)
    const { topic, word } = overrides.topicAndWord || getRandomTopicAndWord();

    // Select exactly one imposter randomly, independent of registration order
    let imposterId;
    if (overrides.imposterId) {
        imposterId = overrides.imposterId;
    } else {
        const randomIndex = Math.floor(Math.random() * players.length);
        imposterId = players[randomIndex].id;
    }

    // Speaking order is a randomized shuffle of player IDs for discussion
    const speakingOrder = overrides.speakingOrder || shuffleArray(players.map(p => p.id));

    // Initialize vote counts: all 0
    const voteCounts = {};
    for (const p of players) {
        voteCounts[p.id] = 0;
    }

    return {
        phase: 'roleReveal', // 'setup' | 'roleReveal' | 'discussion' | 'voting' | 'results'
        players: [...players], // Registration order strictly preserved
        imposterId,
        topic,
        secretWord: word,
        
        // Role Reveal state
        currentViewerIndex: 0,
        isRoleRevealed: false,

        // Discussion state
        roundNumber: 1,
        speakingOrder,
        currentSpeakerIndex: 0,

        // Group Voting state
        voteCounts,
        skipVoteCount: 0,
        isVotingReviewOpen: false,

        // Results state
        results: null,
        roundTransitionMessage: null
    };
}

/**
 * Advances the secret role reveal phase to the next player,
 * or transitions to the discussion phase when all players have viewed their role.
 * 
 * @param {number} currentViewerIndex 
 * @param {number} totalPlayers 
 * @returns {{ nextViewerIndex: number, isComplete: boolean }}
 */
export function advanceRoleReveal(currentViewerIndex, totalPlayers) {
    const nextIndex = currentViewerIndex + 1;
    if (nextIndex >= totalPlayers) {
        return { nextViewerIndex: currentViewerIndex, isComplete: true };
    }
    return { nextViewerIndex: nextIndex, isComplete: false };
}

/**
 * Advances the discussion speaking order to the next speaker,
 * or signals that the round is complete so group voting can begin.
 * 
 * @param {number} currentSpeakerIndex 
 * @param {number} totalSpeakers 
 * @returns {{ nextSpeakerIndex: number, isComplete: boolean }}
 */
export function advanceSpeaker(currentSpeakerIndex, totalSpeakers) {
    const nextIndex = currentSpeakerIndex + 1;
    if (nextIndex >= totalSpeakers) {
        return { nextSpeakerIndex: currentSpeakerIndex, isComplete: true };
    }
    return { nextSpeakerIndex: nextIndex, isComplete: false };
}

/**
 * Starts a new discussion round (e.g. after a tie or skip-vote majority).
 * - Increments discussion round number
 * - Generates a new randomized speaking order using Fisher-Yates
 * - Resets speaking index to 0
 * - Resets all vote counts to 0
 * - Preserves players, imposter, secret word, and topic
 * 
 * @param {Object} prevGameState 
 * @param {string} [reasonMessage]
 * @returns {Object} Updated game state
 */
export function startNextDiscussionRound(prevGameState, reasonMessage = null) {
    const players = prevGameState.players;
    const newSpeakingOrder = shuffleArray(players.map(p => p.id));

    const resetVoteCounts = {};
    for (const p of players) {
        resetVoteCounts[p.id] = 0;
    }

    return {
        ...prevGameState,
        phase: 'discussion',
        roundNumber: prevGameState.roundNumber + 1,
        speakingOrder: newSpeakingOrder,
        currentSpeakerIndex: 0,
        voteCounts: resetVoteCounts,
        skipVoteCount: 0,
        isVotingReviewOpen: false,
        results: null,
        roundTransitionMessage: reasonMessage
    };
}

/**
 * Computes total recorded votes (all player votes + skip votes).
 * @param {Record<string, number>} voteCounts 
 * @param {number} skipVoteCount 
 * @returns {number}
 */
export function getTotalRecordedVotes(voteCounts, skipVoteCount) {
    const playerVotesTotal = Object.values(voteCounts).reduce((sum, count) => sum + (count || 0), 0);
    return playerVotesTotal + (skipVoteCount || 0);
}

/**
 * Safely updates a vote count (+1 or -1) maintaining all invariants:
 * - Count never becomes negative
 * - Total recorded votes never exceeds totalPlayers (N)
 * - Immutable update
 * 
 * @param {Record<string, number>} voteCounts 
 * @param {number} skipVoteCount 
 * @param {number} totalPlayers 
 * @param {string} targetId - Player ID or 'skip'
 * @param {number} delta - +1 or -1
 * @returns {{ voteCounts: Record<string, number>, skipVoteCount: number, changed: boolean }}
 */
export function updateVoteCount(voteCounts, skipVoteCount, totalPlayers, targetId, delta) {
    const currentTotal = getTotalRecordedVotes(voteCounts, skipVoteCount);

    if (delta > 0) {
        // Invariant: sum <= totalPlayers
        if (currentTotal >= totalPlayers) {
            return { voteCounts, skipVoteCount, changed: false };
        }
    }

    if (targetId === 'skip') {
        const currentSkip = skipVoteCount || 0;
        const newSkip = currentSkip + delta;
        if (newSkip < 0) {
            return { voteCounts, skipVoteCount, changed: false };
        }
        return {
            voteCounts: { ...voteCounts },
            skipVoteCount: newSkip,
            changed: true
        };
    }

    // Target is a player
    const currentCount = voteCounts[targetId] || 0;
    const newCount = currentCount + delta;
    if (newCount < 0) {
        return { voteCounts, skipVoteCount, changed: false };
    }

    return {
        voteCounts: {
            ...voteCounts,
            [targetId]: newCount
        },
        skipVoteCount,
        changed: true
    };
}

/**
 * Resolves group voting according to Rules A, B, C, D.
 * 
 * Invariants & Rules:
 * - Can only be resolved when total recorded votes === players.length (N).
 * 
 * Rule A: Skip Vote Majority
 * - If skipVoteCount > N / 2 (strictly more than half):
 *   Nobody eliminated. Go to another discussion round.
 * 
 * Rule B: No player receives any votes
 * - If maxVotes === 0 and Skip Vote was not a strict majority:
 *   Nobody eliminated. Go to another discussion round.
 * 
 * Rule C: Unique highest vote player
 * - The player with the highest vote count is eliminated.
 * - If eliminated player is Imposter: regular players win.
 * - If eliminated player is Regular: imposter wins.
 * 
 * Rule D: Tie for highest votes
 * - If roundNumber === 1 (and allowTieReplay !== false):
 *   Go for Round 2 discussion.
 * - If roundNumber >= 2 (or allowTieReplay === false):
 *   Documented tie rules:
 *   - If tie includes imposter: imposter survives and imposter wins.
 *   - If tie does not include imposter: randomly select one tied player (they are regular), imposter wins.
 * 
 * @param {Record<string, number>} voteCounts 
 * @param {number} skipVoteCount 
 * @param {{ id: string, name: string }[]} players 
 * @param {string} imposterId 
 * @param {Object} [options]
 * @param {number} [options.roundNumber=1]
 * @param {boolean} [options.allowTieReplay=true]
 * @param {string} [options.forcedTieBreakPlayerId] - For testing deterministic tie selection
 * @returns {Object} Resolution result
 */
export function resolveVoteResults(voteCounts, skipVoteCount, players, imposterId, options = {}) {
    const totalPlayers = players.length;
    const totalRecorded = getTotalRecordedVotes(voteCounts, skipVoteCount);

    if (totalRecorded !== totalPlayers) {
        return {
            success: false,
            error: `All ${totalPlayers} votes must be recorded before confirming (currently ${totalRecorded}/${totalPlayers}).`
        };
    }

    const roundNumber = options.roundNumber || 1;
    const allowTieReplay = options.allowTieReplay !== false;

    // Build vote summary list sorted descending by votes
    const voteSummary = players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        votes: voteCounts[p.id] || 0
    })).sort((a, b) => b.votes - a.votes);

    // =========================================================================
    // RULE A: Skip Vote Majority (strictly more than half, > N / 2)
    // =========================================================================
    if (skipVoteCount > totalPlayers / 2) {
        return {
            success: true,
            outcome: 'skip_majority',
            requiresNewDiscussion: true,
            nextRound: roundNumber + 1,
            skipVoteCount,
            voteSummary,
            message: `Skip Vote majority reached (${skipVoteCount}/${totalPlayers}). No one is eliminated! Starting discussion round ${roundNumber + 1}.`
        };
    }

    // =========================================================================
    // STEP: Find max votes among players
    // =========================================================================
    let maxVotes = 0;
    for (const p of players) {
        const count = voteCounts[p.id] || 0;
        if (count > maxVotes) {
            maxVotes = count;
        }
    }

    // =========================================================================
    // RULE B: No player receives any votes
    // =========================================================================
    if (maxVotes === 0) {
        return {
            success: true,
            outcome: 'no_votes',
            requiresNewDiscussion: true,
            nextRound: roundNumber + 1,
            skipVoteCount,
            voteSummary,
            message: `No players received any votes. No one is eliminated! Starting discussion round ${roundNumber + 1}.`
        };
    }

    // Find all players with max votes
    const tiedPlayerIds = players.filter(p => (voteCounts[p.id] || 0) === maxVotes).map(p => p.id);

    // =========================================================================
    // RULE C: Unique highest vote player
    // =========================================================================
    if (tiedPlayerIds.length === 1) {
        const eliminatedId = tiedPlayerIds[0];
        const eliminatedPlayer = players.find(p => p.id === eliminatedId);
        const imposter = players.find(p => p.id === imposterId);
        const isImposter = eliminatedId === imposterId;
        const playersWin = isImposter;

        return {
            success: true,
            outcome: 'elimination',
            requiresNewDiscussion: false,
            eliminatedPlayer,
            eliminatedRole: isImposter ? 'imposter' : 'regular',
            imposter,
            playersWin,
            voteSummary,
            skipVoteCount,
            reason: isImposter
                ? `The players correctly identified and eliminated the imposter (${eliminatedPlayer.name})!`
                : `An innocent player (${eliminatedPlayer.name}) was eliminated! The imposter (${imposter.name}) fooled everyone.`
        };
    }

    // =========================================================================
    // RULE D: Tie for highest votes
    // =========================================================================
    const tiedPlayers = tiedPlayerIds.map(id => players.find(p => p.id === id));
    const tieIncludesImposter = tiedPlayerIds.includes(imposterId);

    // In Round 1, if tie replay is allowed: "Go for a round 2"
    if (roundNumber === 1 && allowTieReplay) {
        return {
            success: true,
            outcome: 'tie_round2',
            requiresNewDiscussion: true,
            isTie: true,
            nextRound: 2,
            tiedPlayers,
            voteSummary,
            skipVoteCount,
            message: `Voting resulted in a tie between ${tiedPlayers.map(p => p.name).join(' & ')} with ${maxVotes} votes each. Starting Round 2 discussion!`
        };
    }

    // If already in round 2 (or tie replay disabled): apply documented tie resolution
    const imposter = players.find(p => p.id === imposterId);

    if (tieIncludesImposter) {
        // Documented rule: Tie includes imposter -> imposter survives (confusion succeeded) -> imposter wins!
        return {
            success: true,
            outcome: 'elimination',
            requiresNewDiscussion: false,
            isTie: true,
            eliminatedPlayer: null, // Imposter survived, no innocent player arbitrarily eliminated
            imposterWonTie: true,
            imposter,
            playersWin: false,
            voteSummary,
            skipVoteCount,
            reason: `A vote tie occurred involving the imposter (${imposter.name}). The imposter survived the tie and wins!`
        };
    }

    // Tie does not include imposter: randomly select one tied player
    let selectedEliminatedPlayer;
    if (options.forcedTieBreakPlayerId) {
        selectedEliminatedPlayer = tiedPlayers.find(p => p.id === options.forcedTieBreakPlayerId) || tiedPlayers[0];
    } else {
        const randomIndex = Math.floor(Math.random() * tiedPlayers.length);
        selectedEliminatedPlayer = tiedPlayers[randomIndex];
    }

    return {
        success: true,
        outcome: 'elimination',
        requiresNewDiscussion: false,
        isTie: true,
        eliminatedPlayer: selectedEliminatedPlayer,
        eliminatedRole: 'regular',
        imposter,
        playersWin: false,
        voteSummary,
        skipVoteCount,
        reason: `A tie occurred among regular players. ${selectedEliminatedPlayer.name} was chosen by tie-break. The imposter (${imposter.name}) survives and wins!`
    };
}

/**
 * Prepares a fresh rematch game with the same registered players.
 * - Preserves player names and original registration order
 * - Selects new random topic and word
 * - Selects new random imposter
 * - Resets all round, turn, voting, and result states
 * 
 * @param {Object} prevGameState 
 * @param {Object} [overrides]
 * @returns {Object} Fresh game state
 */
export function startRematch(prevGameState, overrides = {}) {
    if (!prevGameState || !prevGameState.players) {
        throw new Error('Cannot start rematch without prior game state.');
    }
    return initializePassAndPlayGame(prevGameState.players, overrides);
}
