const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get today's game and check if user has played
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get today's game
    const [games] = await pool.execute(
      'SELECT * FROM daily_games WHERE game_date = ?',
      [today]
    );
    
    if (games.length === 0) {
      return res.json({ 
        hasGame: false,
        message: 'No game available for today' 
      });
    }
    
    const game = games[0];
    
    // Check if user has already played today's game
    const [responses] = await pool.execute(
      'SELECT selected_option, played_at FROM user_game_responses WHERE user_id = ? AND game_id = ?',
      [userId, game.id]
    );
    
    const hasPlayed = responses.length > 0;
    
    res.json({
      hasGame: true,
      hasPlayed,
      game: {
        id: game.id,
        question: game.question,
        option1: {
          text: game.option1_text,
          image: game.option1_image
        },
        option2: {
          text: game.option2_text,
          image: game.option2_image
        }
      },
      ...(hasPlayed && {
        userChoice: responses[0].selected_option,
        playedAt: responses[0].played_at
      })
    });
    
  } catch (error) {
    console.error('Get today\'s game error:', error);
    res.status(500).json({ error: 'Failed to load today\'s game' });
  }
});

// Submit game response
router.post('/play', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameId, selectedOption } = req.body;
    
    if (!gameId || ![1, 2].includes(selectedOption)) {
      return res.status(400).json({ error: 'Invalid game ID or selected option' });
    }
    
    // Verify game exists
    const [games] = await pool.execute(
      'SELECT id FROM daily_games WHERE id = ?',
      [gameId]
    );
    
    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if already played
    const [existing] = await pool.execute(
      'SELECT id FROM user_game_responses WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already played this game' });
    }
    
    // Insert response
    await pool.execute(
      'INSERT INTO user_game_responses (user_id, game_id, selected_option) VALUES (?, ?, ?)',
      [userId, gameId, selectedOption]
    );
    
    // Update stats
    const statsColumn = selectedOption === 1 ? 'option1_count' : 'option2_count';
    await pool.execute(
      `INSERT INTO daily_game_stats (game_id, total_plays, ${statsColumn}) 
       VALUES (?, 1, 1) 
       ON DUPLICATE KEY UPDATE 
       total_plays = total_plays + 1,
       ${statsColumn} = ${statsColumn} + 1`,
      [gameId]
    );
    
    // Get updated stats to return
    const [stats] = await pool.execute(
      'SELECT option1_count, option2_count, total_plays FROM daily_game_stats WHERE game_id = ?',
      [gameId]
    );
    
    const gameStats = stats[0] || { option1_count: 0, option2_count: 0, total_plays: 0 };
    
    res.json({
      success: true,
      message: 'Response recorded successfully',
      stats: {
        option1Percentage: gameStats.total_plays > 0 
          ? Math.round((gameStats.option1_count / gameStats.total_plays) * 100) 
          : 0,
        option2Percentage: gameStats.total_plays > 0 
          ? Math.round((gameStats.option2_count / gameStats.total_plays) * 100) 
          : 0,
        totalPlays: gameStats.total_plays
      }
    });
    
  } catch (error) {
    console.error('Play game error:', error);
    res.status(500).json({ error: 'Failed to record your response' });
  }
});

// Get game statistics (optional)
router.get('/stats/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const [stats] = await pool.execute(
      'SELECT option1_count, option2_count, total_plays FROM daily_game_stats WHERE game_id = ?',
      [gameId]
    );
    
    if (stats.length === 0) {
      return res.json({
        option1Percentage: 0,
        option2Percentage: 0,
        totalPlays: 0
      });
    }
    
    const gameStats = stats[0];
    
    res.json({
      option1Percentage: gameStats.total_plays > 0 
        ? Math.round((gameStats.option1_count / gameStats.total_plays) * 100) 
        : 0,
      option2Percentage: gameStats.total_plays > 0 
        ? Math.round((gameStats.option2_count / gameStats.total_plays) * 100) 
        : 0,
      totalPlays: gameStats.total_plays
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

module.exports = router;
