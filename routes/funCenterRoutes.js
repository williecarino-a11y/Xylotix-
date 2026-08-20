const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

const {
  getAuthenticatedUser
} = require('./authRoutes');

const FunGameSession =
  require('../models/FunGameSession');

const FunGameProfile =
  require('../models/FunGameProfile');

const {
  getFunCenterGames,
  getFunCenterGame,
  validateFunCenterAnswer
} = require('../scripts/learningData/funCenter');

const router = express.Router();

function createSessionId() {
  return crypto.randomUUID();
}

function calculateReward(correctAnswers, totalRounds) {
  const percentage =
    totalRounds > 0
      ? correctAnswers / totalRounds
      : 0;

  const xp =
    25 +
    Math.round(percentage * 75);

  const coins =
    5 +
    Math.round(percentage * 20);

  return {
    xp,
    coins
  };
}

async function requireFunCenterUser(req, res) {
  try {
    const user =
      await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });

      return null;
    }

    return user;

  } catch (error) {
    console.error(
      'Fun Center authentication error:',
      error
    );

    res.status(500).json({
      status: 'error',
      message: 'Unable to verify authentication.'
    });

    return null;
  }
}

/**
 * GET /api/fun-center/games
 *
 * Game definitions are safe to expose.
 * Answer keys are never sent to the browser.
 */
router.get('/games', async (req, res) => {
  try {
    const games =
      getFunCenterGames();

    const safeGames =
      games.map(game => ({
        id: game.id,
        type: game.type,
        titleKey: game.titleKey,
        subtitleKey: game.subtitleKey,
        resultTitleKey:
          game.resultTitleKey,
        resultMessageKey:
          game.resultMessageKey,

        answers:
          game.answers,

        rounds:
          game.rounds.map(round => ({
            id: round.id,
            textKey: round.textKey,
            category: round.category,
            visual: round.visual
          }))
      }));

    return res.json({
      status: 'success',
      data: safeGames
    });

  } catch (error) {
    console.error(
      'Fun Center games error:',
      error
    );

    return res.status(500).json({
      status: 'error',
      message:
        'Unable to load Fun Center games.'
    });
  }
});


/**
 * POST /api/fun-center/session
 *
 * IMPORTANT:
 * The client does NOT provide userId.
 * The authenticated session determines the user.
 */
router.post('/session', async (req, res) => {
  try {
    const user =
      await requireFunCenterUser(req, res);

    if (!user) {
      return;
    }

    const {
      gameId
    } = req.body;

    if (!gameId) {
      return res.status(400).json({
        status: 'error',
        message:
          'gameId is required.'
      });
    }

    const game =
      getFunCenterGame(gameId);

    if (!game) {
      return res.status(404).json({
        status: 'error',
        message:
          'Fun Center game not found.'
      });
    }

    const sessionId =
      createSessionId();

    const session =
      await FunGameSession.create({
        sessionId,
        userId: user._id,
        gameId
      });

    return res.status(201).json({
      status: 'success',
      data: {
        sessionId:
          session.sessionId,

        gameId:
          session.gameId,

        totalRounds:
          game.rounds.length
      }
    });

  } catch (error) {
    console.error(
      'Fun Center session error:',
      error
    );

    return res.status(500).json({
      status: 'error',
      message:
        'Unable to start Fun Center game.'
    });
  }
});


/**
 * POST /api/fun-center/session/:sessionId/answer
 *
 * Only the owner of the game session may submit answers.
 */
router.post(
  '/session/:sessionId/answer',
  async (req, res) => {
    try {
      const user =
        await requireFunCenterUser(req, res);

      if (!user) {
        return;
      }

      const {
        sessionId
      } = req.params;

      const {
        roundIndex,
        answer
      } = req.body;

      const session =
        await FunGameSession.findOne({
          sessionId,
          userId: user._id
        });

      if (!session) {
        return res.status(404).json({
          status: 'error',
          message:
            'Game session not found.'
        });
      }

      if (session.completed) {
        return res.status(409).json({
          status: 'error',
          message:
            'Game session is already completed.'
        });
      }

      const game =
        getFunCenterGame(
          session.gameId
        );

      if (!game) {
        return res.status(404).json({
          status: 'error',
          message:
            'Game definition not found.'
        });
      }

      if (
        !Number.isInteger(roundIndex) ||
        roundIndex < 0 ||
        roundIndex >= game.rounds.length
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Invalid round.'
        });
      }

      if (
        roundIndex !==
        session.roundsCompleted
      ) {
        return res.status(409).json({
          status: 'error',
          message:
            'Invalid game progression.'
        });
      }

      const correct =
        validateFunCenterAnswer(
          session.gameId,
          roundIndex,
          answer
        );

      if (correct) {
        session.correctAnswers++;
        session.score += 100;

        session.maxCombo =
          Math.max(
            session.maxCombo,
            session.correctAnswers
          );
      }

      session.roundsCompleted++;

      await session.save();

      return res.json({
        status: 'success',

        data: {
          correct,

          score:
            session.score,

          correctAnswers:
            session.correctAnswers,

          roundsCompleted:
            session.roundsCompleted,

          totalRounds:
            game.rounds.length,

          complete:
            session.roundsCompleted >=
            game.rounds.length
        }
      });

    } catch (error) {
      console.error(
        'Fun Center answer error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to process game answer.'
      });
    }
  }
);


/**
 * POST /api/fun-center/session/:sessionId/complete
 *
 * Reward claiming is atomic.
 *
 * The session is claimed with:
 *   completed: false
 *   rewardGranted: false
 *
 * inside a MongoDB transaction.
 *
 * Therefore two simultaneous completion requests cannot
 * both award XP/coins for the same game session.
 */
router.post(
  '/session/:sessionId/complete',
  async (req, res) => {
    const mongoSession =
      await mongoose.startSession();

    try {
      const user =
        await requireFunCenterUser(req, res);

      if (!user) {
        await mongoSession.endSession();
        return;
      }

      const {
        sessionId
      } = req.params;

      let completionResult = null;

      await mongoSession.withTransaction(
        async () => {
          const existingSession =
            await FunGameSession.findOne({
              sessionId,
              userId: user._id
            }).session(mongoSession);

          if (!existingSession) {
            const error =
              new Error(
                'Game session not found.'
              );

            error.code =
              'SESSION_NOT_FOUND';

            throw error;
          }

          const game =
            getFunCenterGame(
              existingSession.gameId
            );

          if (!game) {
            const error =
              new Error(
                'Game definition not found.'
              );

            error.code =
              'GAME_NOT_FOUND';

            throw error;
          }

          if (
            existingSession.roundsCompleted <
            game.rounds.length
          ) {
            const error =
              new Error(
                'Game has not been completed.'
              );

            error.code =
              'GAME_NOT_COMPLETED';

            throw error;
          }

          /*
           * Atomic reward claim.
           *
           * Only one request can change a session from
           * rewardGranted:false to rewardGranted:true.
           */
          const reward =
            calculateReward(
              existingSession.correctAnswers,
              game.rounds.length
            );

          const claimedSession =
            await FunGameSession.findOneAndUpdate(
              {
                sessionId,
                userId: user._id,
                completed: false,
                rewardGranted: false,
                roundsCompleted: {
                  $gte: game.rounds.length
                }
              },

              {
                $set: {
                  completed: true,
                  rewardGranted: true,
                  xpAwarded:
                    reward.xp,
                  coinsAwarded:
                    reward.coins,
                  completedAt:
                    new Date()
                }
              },

              {
                new: true,
                session: mongoSession
              }
            );

          if (!claimedSession) {
            const alreadyCompleted =
              await FunGameSession.findOne({
                sessionId,
                userId: user._id
              }).session(mongoSession);

            if (
              alreadyCompleted &&
              alreadyCompleted.completed &&
              alreadyCompleted.rewardGranted
            ) {
              completionResult = {
                alreadyCompleted: true,
                score:
                  alreadyCompleted.score,
                correctAnswers:
                  alreadyCompleted.correctAnswers,
                totalRounds:
                  game.rounds.length,
                xp:
                  alreadyCompleted.xpAwarded,
                coins:
                  alreadyCompleted.coinsAwarded
              };

              return;
            }

            const error =
              new Error(
                'Game completion could not be claimed.'
              );

            error.code =
              'SESSION_CLAIM_FAILED';

            throw error;
          }

          /*
           * Create/update the player's Fun Center profile
           * inside the same transaction.
           */
          const profile =
            await FunGameProfile.findOneAndUpdate(
              {
                userId:
                  user._id
              },

              {
                $inc: {
                  totalXP:
                    reward.xp,

                  totalCoins:
                    reward.coins,

                  gamesPlayed: 1,

                  gamesCompleted: 1,

                  totalRoundsPlayed:
                    claimedSession.roundsCompleted
                }
              },

              {
                upsert: true,
                new: true,
                session: mongoSession,
                setDefaultsOnInsert: true
              }
            );

          /*
           * Best score is also protected by the same transaction.
           */
          const currentBest =
            profile.bestScores &&
            typeof profile.bestScores.get === 'function'
              ? profile.bestScores.get(
                  claimedSession.gameId
                )
              : null;

          if (
            currentBest === undefined ||
            currentBest === null ||
            claimedSession.score > currentBest
          ) {
            profile.bestScores.set(
              claimedSession.gameId,
              claimedSession.score
            );

            await profile.save({
              session: mongoSession
            });
          }

          completionResult = {
            alreadyCompleted: false,

            score:
              claimedSession.score,

            correctAnswers:
              claimedSession.correctAnswers,

            totalRounds:
              game.rounds.length,

            xp:
              reward.xp,

            coins:
              reward.coins,

            totalXP:
              profile.totalXP,

            totalCoins:
              profile.totalCoins
          };
        }
      );

      return res.json({
        status: 'success',
        data: completionResult
      });

    } catch (error) {
      if (
        error.code ===
        'SESSION_NOT_FOUND'
      ) {
        return res.status(404).json({
          status: 'error',
          message:
            'Game session not found.'
        });
      }

      if (
        error.code ===
        'GAME_NOT_FOUND'
      ) {
        return res.status(404).json({
          status: 'error',
          message:
            'Game definition not found.'
        });
      }

      if (
        error.code ===
        'GAME_NOT_COMPLETED'
      ) {
        return res.status(409).json({
          status: 'error',
          message:
            'Game has not been completed.'
        });
      }

      if (
        error.code ===
        'SESSION_CLAIM_FAILED'
      ) {
        return res.status(409).json({
          status: 'error',
          message:
            'Game completion could not be claimed.'
        });
      }

      console.error(
        'Fun Center completion error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to complete Fun Center game.'
      });

    } finally {
      await mongoSession.endSession();
    }
  }
);


module.exports = router;
