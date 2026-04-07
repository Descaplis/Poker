
import { Pool } from 'pg';
import dotenv from 'dotenv';
import e, { text } from 'express';
dotenv.config();

// Konfiguracja połączenia na podstawie zmiennych środowiskowych
console.log(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD, process.env.DB_PORT);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createPotsTable() {
  let query = `
  CREATE TABLE IF NOT EXISTS pots(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  pot_type VARCHAR(4) NOT NULL DEFAULT 'MAIN',
  value INT NOT NULL
  )`;
  return await pool.query(query);
}
await createPotsTable();

async function createPotPlayersTable() {
  let query = `
  CREATE TABLE IF NOT EXISTS pot_players(
  pot_id UUID REFERENCES pots(id),
  player_id UUID,
  PRIMARY KEY (pot_id, player_id)
  )`;
  return await pool.query(query);
}
await createPotPlayersTable();


async function createPlayersTable() {
  let query = 
  `CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(25) NOT NULL,
  seat INT,
  cards VARCHAR(2)[],
  game_id UUID,
  pot_id UUID REFERENCES pots(id),
  bet INT,
  balance INT,
  last_move VARCHAR(5),
  is_folded BOOLEAN NOT NULL DEFAULT FALSE,
  hasGoneAllIn BOOLEAN NOT NULL DEFAULT FALSE
  )`;
  return await pool.query(query);
}
await createPlayersTable();

async function createGamesTable() {
  let query = 
  `CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  players_amount INT NOT NULL,
  time_for_move INT NOT NULL,
  small_blind_value INT NOT NULL,
  initial_balance INT NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'waiting',
  last_move VARCHAR(5),
  current_bet INT,
  pot INT,
  cards VARCHAR(2)[],
  cards_on_table VARCHAR(2)[],
  small_blind_seat INT,
  big_blind_seat INT,
  current_turn_seat INT
  )`;
  return await pool.query(query);
}
await createGamesTable();

async function checkIfGameExists(code) {
  const query = "SELECT * FROM games WHERE code = $1";
  const res = await pool.query(query, [code]);
  return res.rows.length > 0;
}

async function checkIfUsernameTaken(username, game) {
  username = username.trim();
  const query = {
    text: `SELECT players.id FROM players JOIN games ON players.game_id = games.id WHERE players.username = $1 AND games.code = $2`,
    values: [username, game.code]
  };
  const res = await pool.query(query);
  return res.rows.length > 0;
}

const createDeck = () => {
  const colors = ['h', 'd', 'c', 's'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  let deck = [];

  for (const color of colors) {
    
    for (const rank of ranks) {
      deck.push(`${rank}${color}`);
    }
  }
  return shuffleDeck(deck);
}

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Remember that this function modifies the original deck by removing the chosen cards
const drawCardsFromDeck = (deck, amount) => deck.splice(0, amount);

async function createGame(playersAmount, timeForMove, smallBlindValue, initialBalance, hostUsername) {
  // Generate a unique 6-character code
  let query = `SELECT code FROM games`;
  const existingCodes = await pool.query(query).then(res => res.rows.map(row => row.code));
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
  } while (existingCodes.includes(code));

  const deck = createDeck();

  // Insert the new game into the database
  query = {
    text: `INSERT INTO games (code, players_amount, time_for_move, small_blind_value, initial_balance, cards, small_blind_seat, big_blind_seat)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    values: [code, playersAmount, timeForMove, smallBlindValue, initialBalance, deck, 0, 1]
  }

  const gameId = await pool.query(query).then(res => res.rows[0].id);

  // Insert the host player into the database
  query = {
  text: `INSERT INTO players (username, game_id, seat, balance)
  VALUES ($1, $2, $3, $4)`,
  values: [hostUsername, gameId, 0, initialBalance],
  }
  await pool.query(query);
  return gameId;
}


async function joinGame(username, gameCode) {
  const cleanUsername = username.trim();

  if (!(await checkIfGameExists(gameCode))) {
    return { success: false, message: "Gra z takim kodem nie istnieje" };
  }

  const gameQuery = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  };
  const game = await pool.query(gameQuery).then(res => res.rows[0]);

  if (await checkIfUsernameTaken(cleanUsername, game)) {
    return { success: false, message: "Ta nazwa użytkownika jest już zajęta" };
  }

  const countQuery = {
    text: `SELECT COUNT(*) FROM players WHERE game_id = $1`,
    values: [game.id]
  };
  const playersAmount = await pool.query(countQuery).then(res => parseInt(res.rows[0].count));

  if (playersAmount >= game.players_amount) {
    return { success: false, message: "Ta gra jest już pełna" };
  }

  try {
    const insertQuery = {
      text: `INSERT INTO players (username, game_id, seat, balance) VALUES ($1, $2, $3, $4)`,
      values: [cleanUsername, game.id, playersAmount, game.initial_balance]
    };
    await pool.query(insertQuery);
    return { success: true };
  } catch (err) {
    return { success: false, message: err };
  }
}

async function BetBlinds(gameCode) {
  // Get the game
  let query = {
    text: `SELECT id FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Get the players
  query = {
    text: `SELECT seat FROM players WHERE game_id = $1 AND (seat = $2 OR seat = $3)`,
    values: [game.id, game.small_blind_seat, game.big_blind_seat]
  }
  const players = await pool.query(query).then(res => res.rows);
  
  // Bet the blinds
  for (const player of players) {
    let betValue = player.seat === game.small_blind_seat ? game.small_blind_value : game.small_blind_value * 2;
    query = {
      text: `UPDATE players SET bet = $1, balance = balance - $1 WHERE game_id = $2 AND seat = $3`,
      values: [betValue, game.id, player.seat]
    }
    await pool.query(query);
  }

  return "Blindy zostały postawione";
}

async function GiveCardsToPlayers(gameCode) {
  // Get the game
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Get the players
  query = {
    text: `SELECT * FROM players WHERE game_id = $1`,
    values: [game.id]
  }
  const players = await pool.query(query).then(res => res.rows);

  let deck = game.cards;

  // Give 2 cards to each player
  for (const player of players) {
    const cards = drawCardsFromDeck(deck, 2);
    query = {
      text: `UPDATE players SET cards = $1 WHERE id = $2`,
      values: [cards, player.id]
    }
    await pool.query(query);
  }

  // Update deck in database
  query = {
    text: `UPDATE games SET cards = $1 WHERE id = $2`,
    values: [deck, game.id]
  }
  return await pool.query(query);
}

async function PutCardsOnTable(gameCode, amount) {
  // Get the game
  let query = {
    text: `SELECT id FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);
  const deck = game.cards;
  const cardsOnTable = drawCardsFromDeck(deck, amount);

  // Update cards on table
  query = {
    text: `UPDATE games SET cards_on_table = cards_on_table || $1, cards = $2 WHERE id = $3`,
    values: [cardsOnTable, deck, game.id]
  }
  return await pool.query(query);
}

async function startGame(gameCode) {
  await BetBlinds(gameCode);
  return await GiveCardsToPlayers(gameCode);
  // wait for players to make their moves, then put cards on table and so on
}

async function Raise(gameCode, seat, raiseAmount) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let query = {
      text: `SELECT id, current_bet FROM games WHERE code = $1 FOR UPDATE`,
      values: [gameCode]
    };
    const game = await client.query(query).then(res => res.rows[0]);
    
    if (!game) throw new Error("Nie znaleziono gry.");

    query = {
      text: `SELECT id, balance, bet FROM players WHERE game_id = $1 AND seat = $2 FOR UPDATE`,
      values: [game.id, seat]
    };
    const player = await client.query(query).then(res => res.rows[0]);

    if (!player) throw new Error("Nie znaleziono gracza na tym miejscu.");
    if (player.balance < raiseAmount) throw new Error("Gracz nie ma wystarczająco żetonów.");

    const targetTotalBet = Number(game.current_bet) + Number(raiseAmount);
    const amountToSubtract = targetTotalBet - Number(player.bet);
    
    const isAllIn = targetTotalBet >= Number(player.balance);

    query = {
      text: `UPDATE players SET bet = $1, balance = balance - $2, "hasGoneAllIn" = ($3 = 0) WHERE id = $4`,
      values: [targetTotalBet, amountToSubtract, player.balance - amountToSubtract, player.id]
    };
    await client.query(query);

    query = {
      text: `UPDATE games SET current_bet = $1 WHERE id = $2`,
      values: [targetTotalBet, game.id]
    }
    await client.query(query);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }

  return await NextTurn(gameCode);
}

async function Fold(gameCode, seat) {
  // Get the game
  let query = {
    text: `SELECT id FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Update player's status to folded
  query = {
    text: `UPDATE players SET is_folded = TRUE WHERE game_id = $1 AND seat = $2`,
    values: [game.id, seat]
  }
  await pool.query(query);

  return await NextTurn(gameCode);
}

async function Check(gameCode, seat) {
  // Get the game
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Get current bet
  const currentBet = game.current_bet;
  if (currentBet === 0) {
    return await NextTurn(gameCode);
  }

  // Check if player has enough balance to check
  query = {
    text: `SELECT balance FROM players WHERE game_id = $1 AND seat = $2`,
    values: [game.id, seat]
  }
  const playerBalance = await pool.query(query).then(res => res.rows[0].balance);

  if (playerBalance <= currentBet) {
    // All-in - Player can only bet the amount of their balance, a side pull must then be created
    query = {
      text: `UPDATE players SET bet = bet + balance, balance = 0, hasGoneAllIn = TRUE WHERE game_id = $1 AND seat = $2`,
      values: [game.id, seat]
    }
    await pool.query(query);
  } else {
    // Check - update player's bet and balance to match current bet
    query = {
      text: `UPDATE players SET bet = $1, balance = balance - $1 WHERE game_id = $2 AND seat = $3`,
      values: [currentBet, game.id, seat]
    }
    await pool.query(query);
  }

  return await NextTurn(gameCode);
}

async function NextTurn(gameCode) {
  // Get the game
  let query = {
    text: `SELECT current_turn_seat FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0].current_turn_seat);
  // Determine the next turn seat
  const nextTurnSeat = (game.current_turn_seat + 1) % (game.players_amount);

  // Update the current turn seat in the game
  query = {
    text: `UPDATE games SET current_turn_seat = $1 WHERE id = $2`,
    values: [nextTurnSeat, game.id]
  }
  await pool.query(query);
  return await EndRoundIfCan(game);
}

async function ResolvePots(gameId) {
  // Get players who didn't fold and have bet more than 0
  const players = (await pool.query(
    `SELECT id, bet, "hasGoneAllIn", is_folded FROM players WHERE game_id = $1 AND bet > 0 ORDER BY bet ASC`,
    [gameId]
  )).rows;

  if (players.length === 0) return;

  let lastAllInLevel = 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const currentLevel = p.bet;

    if (currentLevel > lastAllInLevel) {
      const contributionPerPlayer = currentLevel - lastAllInLevel;
      let potValue = 0;
      let eligiblePlayerIds = [];

      // Every player with bet >= currentLevel is on this pot
      players.forEach(otherP => {
        if (otherP.bet >= currentLevel) {
          potValue += contributionPerPlayer;
          if (!otherP.is_folded) {
            eligiblePlayerIds.push(otherP.id);
          }
        }
      });

      // Insert the pot into the database
      const type = (lastAllInLevel === 0) ? 'MAIN' : 'SIDE';
      
      const newPot = await pool.query(
        `INSERT INTO pots (game_id, value, pot_type) VALUES ($1, $2, $3) RETURNING id`,
        [gameId, potValue, type]
      );

      // Save which players are eligible for this pot
      for (let playerId of eligiblePlayerIds) {
        await pool.query(
          `INSERT INTO pot_players (pot_id, player_id) VALUES ($1, $2)`,
          [newPot.rows[0].id, playerId]
        );
      }

      lastAllInLevel = currentLevel;
    }
  }
}

async function EndRoundIfCan(game) {
  // Get the players
  query = {
    text: `SELECT * FROM players WHERE game_id = $1`,
    values: [game.id]
  }
  const players = await pool.query(query).then(res => res.rows);

  const currentBet = game.current_bet;
  const activePlayers = players.filter(player => !player.is_folded);
  const allPlayersHaveEqualBets = activePlayers.every(player => player.bet === currentBet || player.hasGoneAllIn);
  if (allPlayersHaveEqualBets) {
    await ResolvePots(game.id);
    // End the round
    query = {
      text: `UPDATE players SET bet = 0 WHERE game_id = $1`,
      values: [game.id]
    }
    await pool.query(query);

    const small_blind_seat = (game.small_blind_seat + 1) % (game.players_amount + 1);
    const big_blind_seat = (game.big_blind_seat + 1) % (game.players_amount + 1);
    query = {
      text: `UPDATE games SET current_bet = 0, current_turn_seat = 0, small_blind_seat = $1, big_blind_seat = $2 WHERE id = $3`,
      values: [small_blind_seat, big_blind_seat, game.id]
    }
    await pool.query(query);

    // Next round or end game if it was the last one
    await NextRoundOrEndGame(game);
    return "Round finished";
  }
}

async function NextRoundOrEndGame(game) {
  // If it was the last round, determine the winner and end the game
  if (game.cards_on_table.length == 5) {
    return await DetermineWinner(game);
  } else {
    // Put cards on table and start next round
    await PutCardsOnTable(game.code, 1);
    return await BetBlinds(game.code);
  }
}

async function DetermineWinner(game) {
  // Get the pots
  let winners, ranks;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let query = {
      text: `SELECT * FROM pots WHERE game_id = $1`,
      values: [game.id]
    }
    const pots = await client.query(query).then(res => res.rows);

    for (let pot of pots) {
      // Find players who didn't fold
      query = `SELECT p.id
         FROM players p
         JOIN pot_players pp ON p.id = pp.player_id
         WHERE pp.pot_id = $1 AND p.is_folded = FALSE`;

      const eligiblePlayers = await client.query(query).then(res => res.rows);

      if (eligiblePlayers.length == 0) continue;

      let Hand = require('pokersolver').Hand;
      const playersHands = eligiblePlayers
        .filter(player => !player.is_folded)
        .map(player => {
          const hand = Hand.solve([...player.cards, ...game.cards_on_table]);
          return { player, hand };
        });

      const winningHands = Hand.winners(playersHands.map(ph => ph.hand));
      winners = playersHands.filter(ph => winningHands.some(wh => wh === ph.hand));
      ranks = winners.map(ph => ph.hand.name);

      const share = Math.floor(pot.value / winners.length);
      const remainder = pot.value % winners.length;

      for (let i = 0; i < winners.length; i++) {
        let amountToGive = share;

        if (i === 0) amountToGive += remainder;

        query = {
          text: `UPDATE players SET balance = balance + $1 WHERE id = $2`,
          values: [amountToGive, winners[i].id]
        }
        await client.query(query);
      }
    }

    await client.query(`DELETE FROM pot_players WHERE pot_id IN (SELECT id FROM pots WHERE game_id = $1)`, [game.id]);
    await client.query(`DELETE FROM pots WHERE game_id = $1`, [game.id]);
    await client.query(`UPDATE players SET is_folded = FALSE, "hasGoneAllIn" = FALSE, bet = 0 WHERE game_id = $1`, [game.id]);

    await client.query("COMMIT");
  } catch(e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return { winners: winners, ranks: ranks};
}

// FUNCTIONS TO GET CERTAIN VALUES
// create game, join game, check if game exists, start game

async function GetListOfPlayers(code) {
  let query = {
    text: `SELECT id FROM games WHERE code = $1`,
    value: [code]
  }
  const gameid = await pool.query(query).then(res => res.rows[0].id);

  query = {
    text: `SELECT * FROM players WHERE game_id = $1`,
    values: [gameid]
  }
  return await pool.query(query).then(res => res.rows);
}

async function GetMaximumRaiseValue(playerId) {
  let query = {
    text: `SELECT balance FROM players WHERE id = $1`,
    values: [playerId]
  }
  return await pool.query(query).then(res => res.rows[0].balance);
}

async function GetPlayerCards(playerId) {
  let query = {
    text: `SELECT cards FROM players WHERE id = $1`,
    values: [playerId]
  }
  return await pool.query(query).then(res => res.rows[0].cards);
}

async function GetCurrentTurnSeat(gameId) {
  let query = {
    text: `SELECT current_turn_seat FROM games WHERE id = $1`,
    values: [gameId]
  }
  return await pool.query(query).then(res => res.rows[0].current_turn_seat);
}

async function GetSmallBlindSeat(gameId) {
  let query = {
    text: `SELECT small_blind_seat FROM games WHERE id = $1`,
    values: [gameId]
  }
  return await pool.query(query).then(res => res.rows[0].small_blind_seat);
}

async function GetBigBlindSeat(gameId) {
  let query = {
    text: `SELECT big_blind_seat FROM games WHERE id = $1`,
    values: [gameId]
  }
  return await pool.query(query).then(res => res.rows[0].big_blind_seat);
}

async function GetCardsOnTable(gameId) {
  let query = {
    text: `SELECT cards_on_table FROM games WHERE id = $1`,
    values: [gameId]
  }
  return await pool.query(query).then(res => res.rows[0].cards_on_table);
}

export { pool, createGame, joinGame, startGame, Raise, Check, Fold, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable };