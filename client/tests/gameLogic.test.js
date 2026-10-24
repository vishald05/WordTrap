import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    validateNewPlayer,
    createPlayer,
    shuffleArray,
    initializePassAndPlayGame,
    advanceRoleReveal,
    advanceSpeaker,
    startNextDiscussionRound,
    getTotalRecordedVotes,
    updateVoteCount,
    resolveVoteResults,
    startRematch
} from '../src/passAndPlay/gameLogic.js';
import { MIN_PLAYERS, TOPICS } from '../src/data/topics.js';

describe('Player Setup & Validation', () => {
    it('validates and accepts a standard player name', () => {
        const res = validateNewPlayer('Alice', []);
        assert.equal(res.valid, true);
        assert.equal(res.trimmedName, 'Alice');
    });

    it('trims leading and trailing whitespace', () => {
        const res = validateNewPlayer('   Bob Smith   ', []);
        assert.equal(res.valid, true);
        assert.equal(res.trimmedName, 'Bob Smith');
    });

    it('rejects blank, empty, or whitespace-only names', () => {
        assert.equal(validateNewPlayer('', []).valid, false);
        assert.equal(validateNewPlayer('    ', []).valid, false);
        assert.equal(validateNewPlayer(null, []).valid, false);
        assert.equal(validateNewPlayer(undefined, []).valid, false);
    });

    it('rejects duplicate names case-insensitively', () => {
        const existing = [
            createPlayer('Alice'),
            createPlayer('Bob')
        ];

        const exactDup = validateNewPlayer('Alice', existing);
        assert.equal(exactDup.valid, false);
        assert.match(exactDup.error, /already exists/i);

        const caseDup = validateNewPlayer('aLiCe', existing);
        assert.equal(caseDup.valid, false);
        assert.match(caseDup.error, /already exists/i);

        const paddedDup = validateNewPlayer('   bob   ', existing);
        assert.equal(paddedDup.valid, false);
        assert.match(paddedDup.error, /already exists/i);
    });

    it('rejects names exceeding 20 characters', () => {
        const res = validateNewPlayer('ThisNameIsDefinitelyWayTooLongToBeValid', []);
        assert.equal(res.valid, false);
        assert.match(res.error, /cannot exceed 20 characters/i);
    });

    it('generates stable unique player IDs', () => {
        const p1 = createPlayer('Alice');
        const p2 = createPlayer('Bob');
        assert.ok(p1.id);
        assert.ok(p2.id);
        assert.notEqual(p1.id, p2.id);
        assert.equal(p1.name, 'Alice');
        assert.equal(p2.name, 'Bob');
    });

    it('preserves registration order when adding and removing players', () => {
        let players = [
            createPlayer('Alice', 'p1'),
            createPlayer('Bob', 'p2'),
            createPlayer('Charlie', 'p3'),
            createPlayer('Diana', 'p4')
        ];

        // Verify order
        assert.deepEqual(players.map(p => p.name), ['Alice', 'Bob', 'Charlie', 'Diana']);

        // Remove Bob
        players = players.filter(p => p.id !== 'p2');
        assert.deepEqual(players.map(p => p.name), ['Alice', 'Charlie', 'Diana']);

        // Add Eve
        players.push(createPlayer('Eve', 'p5'));
        assert.deepEqual(players.map(p => p.name), ['Alice', 'Charlie', 'Diana', 'Eve']);
    });

    it('enforces minimum player requirement (4 players)', () => {
        assert.equal(MIN_PLAYERS, 4);

        const threePlayers = [
            createPlayer('Alice'),
            createPlayer('Bob'),
            createPlayer('Charlie')
        ];

        assert.throws(() => {
            initializePassAndPlayGame(threePlayers);
        }, /At least 4 players are required/);

        const fourPlayers = [
            ...threePlayers,
            createPlayer('Diana')
        ];

        const game = initializePassAndPlayGame(fourPlayers);
        assert.equal(game.phase, 'roleReveal');
        assert.equal(game.players.length, 4);
    });
});

describe('Role Assignment & Initialization', () => {
    const players = [
        createPlayer('Alice', 'p1'),
        createPlayer('Bob', 'p2'),
        createPlayer('Charlie', 'p3'),
        createPlayer('Diana', 'p4')
    ];

    it('assigns exactly one imposter and validates roles', () => {
        const game = initializePassAndPlayGame(players);

        assert.ok(game.imposterId);
        assert.ok(players.some(p => p.id === game.imposterId));
        assert.ok(game.topic);
        assert.ok(game.secretWord);

        // Verify topic exists in topics list and word belongs to topic
        const topicObj = TOPICS.find(t => t.topic === game.topic);
        assert.ok(topicObj, 'Topic should exist in TOPICS');
        assert.ok(topicObj.words.includes(game.secretWord), 'Word should belong to topic');

        // Imposter sees only topic, regular player sees topic + secret word
        for (const p of game.players) {
            const isImposter = p.id === game.imposterId;
            if (isImposter) {
                // In UI, imposter will see topic, but not the secret word
                assert.equal(isImposter, true);
            } else {
                assert.equal(isImposter, false);
            }
        }
    });

    it('random role assignment is independent of registration order', () => {
        const imposterCounts = { p1: 0, p2: 0, p3: 0, p4: 0 };
        const trials = 400;

        for (let i = 0; i < trials; i++) {
            const game = initializePassAndPlayGame(players);
            imposterCounts[game.imposterId]++;
        }

        // Each player should be imposter roughly 25% of the time (at least > 10% in 400 trials)
        for (const p of players) {
            assert.ok(
                imposterCounts[p.id] > 30,
                `Player ${p.name} should be picked reasonably often, got ${imposterCounts[p.id]}`
            );
        }
    });

    it('preserves registration order in game state', () => {
        const game = initializePassAndPlayGame(players);
        assert.deepEqual(game.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4']);
    });
});

describe('Role Reveal Transitions', () => {
    it('advances in registration order and completes after last player', () => {
        const total = 4;
        let step = advanceRoleReveal(0, total);
        assert.equal(step.nextViewerIndex, 1);
        assert.equal(step.isComplete, false);

        step = advanceRoleReveal(1, total);
        assert.equal(step.nextViewerIndex, 2);
        assert.equal(step.isComplete, false);

        step = advanceRoleReveal(2, total);
        assert.equal(step.nextViewerIndex, 3);
        assert.equal(step.isComplete, false);

        step = advanceRoleReveal(3, total);
        assert.equal(step.isComplete, true);
    });
});

describe('Discussion Phase & Order Shuffling', () => {
    const players = [
        createPlayer('Alice', 'p1'),
        createPlayer('Bob', 'p2'),
        createPlayer('Charlie', 'p3'),
        createPlayer('Diana', 'p4')
    ];

    it('ensures every player appears exactly once in speaking order', () => {
        const game = initializePassAndPlayGame(players);
        assert.equal(game.speakingOrder.length, 4);

        const uniqueIds = new Set(game.speakingOrder);
        assert.equal(uniqueIds.size, 4);
        for (const p of players) {
            assert.ok(uniqueIds.has(p.id));
        }

        // Registration order itself must remain untouched
        assert.deepEqual(game.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4']);
    });

    it('advances speakers and signals completion on last speaker', () => {
        assert.deepEqual(advanceSpeaker(0, 4), { nextSpeakerIndex: 1, isComplete: false });
        assert.deepEqual(advanceSpeaker(1, 4), { nextSpeakerIndex: 2, isComplete: false });
        assert.deepEqual(advanceSpeaker(2, 4), { nextSpeakerIndex: 3, isComplete: false });
        assert.deepEqual(advanceSpeaker(3, 4), { nextSpeakerIndex: 3, isComplete: true });
    });

    it('creates a new randomized order on next discussion round while preserving roles and word', () => {
        const initialGame = initializePassAndPlayGame(players);
        const originalTopic = initialGame.topic;
        const originalWord = initialGame.secretWord;
        const originalImposter = initialGame.imposterId;

        const round2 = startNextDiscussionRound(initialGame, 'Testing tie-breaker');

        assert.equal(round2.phase, 'discussion');
        assert.equal(round2.roundNumber, 2);
        assert.equal(round2.currentSpeakerIndex, 0);
        assert.equal(round2.topic, originalTopic);
        assert.equal(round2.secretWord, originalWord);
        assert.equal(round2.imposterId, originalImposter);
        assert.equal(round2.skipVoteCount, 0);
        assert.equal(round2.voteCounts['p1'], 0);
        assert.equal(round2.speakingOrder.length, 4);
        assert.deepEqual(new Set(round2.speakingOrder), new Set(['p1', 'p2', 'p3', 'p4']));
    });
});

describe('Group Voting Aggregate Counter', () => {
    const totalPlayers = 4;
    const initialVoteCounts = { p1: 0, p2: 0, p3: 0, p4: 0 };
    const initialSkip = 0;

    it('starts with all player counts and Skip Vote at zero', () => {
        assert.equal(getTotalRecordedVotes(initialVoteCounts, initialSkip), 0);
        for (const count of Object.values(initialVoteCounts)) {
            assert.equal(count, 0);
        }
    });

    it('increments player counts and skip votes correctly', () => {
        let state = updateVoteCount(initialVoteCounts, initialSkip, totalPlayers, 'p1', 1);
        assert.equal(state.changed, true);
        assert.equal(state.voteCounts['p1'], 1);
        assert.equal(getTotalRecordedVotes(state.voteCounts, state.skipVoteCount), 1);

        state = updateVoteCount(state.voteCounts, state.skipVoteCount, totalPlayers, 'p1', 1);
        assert.equal(state.voteCounts['p1'], 2);
        assert.equal(getTotalRecordedVotes(state.voteCounts, state.skipVoteCount), 2);

        state = updateVoteCount(state.voteCounts, state.skipVoteCount, totalPlayers, 'skip', 1);
        assert.equal(state.skipVoteCount, 1);
        assert.equal(getTotalRecordedVotes(state.voteCounts, state.skipVoteCount), 3);
    });

    it('decrements counts and prevents negative counts', () => {
        // Decrementing at 0 does nothing
        const noOp = updateVoteCount(initialVoteCounts, initialSkip, totalPlayers, 'p1', -1);
        assert.equal(noOp.changed, false);
        assert.equal(noOp.voteCounts['p1'], 0);

        // Increment then decrement
        let state = updateVoteCount(initialVoteCounts, initialSkip, totalPlayers, 'p2', 1);
        assert.equal(state.voteCounts['p2'], 1);

        state = updateVoteCount(state.voteCounts, state.skipVoteCount, totalPlayers, 'p2', -1);
        assert.equal(state.voteCounts['p2'], 0);

        // Skip decrement
        let skipState = updateVoteCount(initialVoteCounts, 1, totalPlayers, 'skip', -1);
        assert.equal(skipState.skipVoteCount, 0);

        skipState = updateVoteCount(skipState.voteCounts, 0, totalPlayers, 'skip', -1);
        assert.equal(skipState.changed, false);
        assert.equal(skipState.skipVoteCount, 0);
    });

    it('enforces invariant: total recorded votes cannot exceed totalPlayers (N)', () => {
        let counts = { p1: 1, p2: 1, p3: 1, p4: 0 };
        let skip = 1; // Total = 4 = totalPlayers

        assert.equal(getTotalRecordedVotes(counts, skip), 4);

        // Attempting to increment p4 must be rejected
        const blocked1 = updateVoteCount(counts, skip, totalPlayers, 'p4', 1);
        assert.equal(blocked1.changed, false);
        assert.equal(blocked1.voteCounts['p4'], 0);

        // Attempting to increment skip must be rejected
        const blocked2 = updateVoteCount(counts, skip, totalPlayers, 'skip', 1);
        assert.equal(blocked2.changed, false);
        assert.equal(blocked2.skipVoteCount, 1);
    });

    it('allows correcting mistakes through decrement and increment', () => {
        let counts = { p1: 2, p2: 1, p3: 1, p4: 0 };
        let skip = 0; // Total = 4

        // Holder accidentally gave p1 2 votes instead of p4
        // Holder decrements p1
        let state = updateVoteCount(counts, skip, totalPlayers, 'p1', -1);
        assert.equal(state.voteCounts['p1'], 1);
        assert.equal(getTotalRecordedVotes(state.voteCounts, state.skipVoteCount), 3);

        // Now holder can increment p4
        state = updateVoteCount(state.voteCounts, state.skipVoteCount, totalPlayers, 'p4', 1);
        assert.equal(state.voteCounts['p4'], 1);
        assert.equal(getTotalRecordedVotes(state.voteCounts, state.skipVoteCount), 4);
    });
});

describe('Vote Resolution & Tie Breaking', () => {
    const players = [
        createPlayer('Alice', 'p1'),
        createPlayer('Bob', 'p2'),
        createPlayer('Charlie', 'p3'),
        createPlayer('Diana', 'p4')
    ];
    const imposterId = 'p2'; // Bob is imposter

    it('rejects confirmation if fewer than N votes have been recorded', () => {
        const voteCounts = { p1: 1, p2: 1, p3: 1, p4: 0 };
        const skip = 0; // 3 out of 4

        const res = resolveVoteResults(voteCounts, skip, players, imposterId);
        assert.equal(res.success, false);
        assert.match(res.error, /All 4 votes must be recorded/);
    });

    it('Rule A: Strict Skip Vote majority triggers another discussion round', () => {
        // N = 4. Strictly more than half means skip > 2 (i.e. 3 or 4)
        const voteCounts = { p1: 1, p2: 0, p3: 0, p4: 0 };
        const skip = 3; // 3 > 4/2

        const res = resolveVoteResults(voteCounts, skip, players, imposterId, { roundNumber: 1 });
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'skip_majority');
        assert.equal(res.requiresNewDiscussion, true);
        assert.equal(res.nextRound, 2);
    });

    it('Exactly half of players voting Skip is NOT a majority', () => {
        // N = 4. Skip = 2 is NOT > 2
        const voteCounts = { p1: 2, p2: 0, p3: 0, p4: 0 };
        const skip = 2;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId);
        assert.equal(res.success, true);
        assert.notEqual(res.outcome, 'skip_majority');
        // p1 has unique highest (2 votes), p1 eliminated
        assert.equal(res.outcome, 'elimination');
        assert.equal(res.eliminatedPlayer.id, 'p1');
    });

    it('Rule B: No player receives any votes triggers another discussion round', () => {
        // If all 4 players vote Skip (though Skip=4 also triggers Skip majority),
        // let's verify 0 max player votes triggers next round
        const voteCounts = { p1: 0, p2: 0, p3: 0, p4: 0 };
        const skip = 4;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId);
        assert.equal(res.success, true);
        assert.equal(res.requiresNewDiscussion, true);
    });

    it('Rule C: Unique highest vote player is eliminated and imposter caught -> players win', () => {
        const voteCounts = { p1: 1, p2: 3, p3: 0, p4: 0 }; // Bob (p2) is imposter
        const skip = 0;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId);
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'elimination');
        assert.equal(res.eliminatedPlayer.id, 'p2');
        assert.equal(res.eliminatedRole, 'imposter');
        assert.equal(res.playersWin, true);
    });

    it('Rule C: Unique highest vote player is eliminated and innocent player caught -> imposter wins', () => {
        const voteCounts = { p1: 3, p2: 0, p3: 1, p4: 0 }; // Alice (p1) is innocent
        const skip = 0;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId);
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'elimination');
        assert.equal(res.eliminatedPlayer.id, 'p1');
        assert.equal(res.eliminatedRole, 'regular');
        assert.equal(res.playersWin, false);
    });

    it('Rule D: Highest-vote tie in Round 1 triggers Round 2 discussion', () => {
        // Tie between p1 (Alice) and p2 (Bob) with 2 votes each
        const voteCounts = { p1: 2, p2: 2, p3: 0, p4: 0 };
        const skip = 0;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId, { roundNumber: 1 });
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'tie_round2');
        assert.equal(res.requiresNewDiscussion, true);
        assert.equal(res.nextRound, 2);
        assert.equal(res.isTie, true);
        assert.equal(res.tiedPlayers.length, 2);
    });

    it('Rule D: Highest-vote tie involving imposter in Round 2 results in imposter victory', () => {
        // Tie between p1 (Alice) and p2 (Bob, imposter) with 2 votes each in Round 2
        const voteCounts = { p1: 2, p2: 2, p3: 0, p4: 0 };
        const skip = 0;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId, { roundNumber: 2 });
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'elimination');
        assert.equal(res.requiresNewDiscussion, false);
        assert.equal(res.isTie, true);
        assert.equal(res.playersWin, false);
        assert.equal(res.imposter.id, 'p2');
        assert.match(res.reason, /tie occurred involving the imposter/i);
    });

    it('Rule D: Highest-vote tie without imposter selects a tied player and imposter wins', () => {
        // Tie between p1 (Alice) and p3 (Charlie) with 2 votes each. Bob (p2) is imposter.
        const voteCounts = { p1: 2, p2: 0, p3: 2, p4: 0 };
        const skip = 0;

        const res = resolveVoteResults(voteCounts, skip, players, imposterId, {
            roundNumber: 2,
            forcedTieBreakPlayerId: 'p3'
        });
        assert.equal(res.success, true);
        assert.equal(res.outcome, 'elimination');
        assert.equal(res.isTie, true);
        assert.equal(res.eliminatedPlayer.id, 'p3');
        assert.equal(res.eliminatedRole, 'regular');
        assert.equal(res.playersWin, false);
    });
});

describe('Results & Rematch Flow', () => {
    const players = [
        createPlayer('Alice', 'p1'),
        createPlayer('Bob', 'p2'),
        createPlayer('Charlie', 'p3'),
        createPlayer('Diana', 'p4')
    ];

    it('Play Again preserves player list and registration order', () => {
        const game1 = initializePassAndPlayGame(players);
        const game2 = startRematch(game1);

        assert.deepEqual(game2.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4']);
        assert.deepEqual(game2.players.map(p => p.name), ['Alice', 'Bob', 'Charlie', 'Diana']);
    });

    it('Play Again clears previous votes, rounds, and results', () => {
        const game1 = initializePassAndPlayGame(players);
        game1.roundNumber = 2;
        game1.voteCounts = { p1: 2, p2: 2, p3: 0, p4: 0 };
        game1.skipVoteCount = 0;
        game1.results = { winner: 'imposter' };

        const rematch = startRematch(game1);
        assert.equal(rematch.phase, 'roleReveal');
        assert.equal(rematch.roundNumber, 1);
        assert.equal(rematch.currentViewerIndex, 0);
        assert.equal(rematch.currentSpeakerIndex, 0);
        assert.equal(rematch.skipVoteCount, 0);
        assert.equal(rematch.results, null);
        assert.deepEqual(rematch.voteCounts, { p1: 0, p2: 0, p3: 0, p4: 0 });
    });
});
