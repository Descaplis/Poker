// lib/db.js
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

async function createPlayersTable() {
  const query = 
  `CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  seat INT,
  cards VARCHAR(2)[],
  game_id UUID,
  bet INT,
  balance INT,
  last_move VARCHAR(5),
  is_folded BOOLEAN NOT NULL DEFAULT FALSE
  )`;
  return await pool.query(query);
}
await createPlayersTable();

async function createGamesTable() {
  const query = 
  `CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  players_amount INT NOT NULL,
  time_for_move INT NOT NULL,
  small_blind_value INT NOT NULL,
  initial_balance INT NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'waiting',
  current_turn_seat INT,
  FOREIGN KEY (current_turn_seat) REFERENCES players(seat),
  last_move VARCHAR(5),
  current_bet INT,
  bet_sum INT,
  cards VARCHAR(2)[],
  cards_on_table VARCHAR(2)[],
  small_blind_seat INT,
  FOREIGN KEY (small_blind_seat) REFERENCES players(seat),
  big_blind_seat INT,
  FOREIGN KEY (big_blind_seat) REFERENCES players(seat)
  )`;
  return await pool.query(query);
}
await createGamesTable();

async function checkIfGameExists(code) {
  const query = "SELECT * FROM games WHERE code = $1";
  const res = await pool.query(query, [code]);
  return res.rows.length > 0;
}

const shuffleDeck = (deck) => deck.sort(() => Math.random() - 0.5);

// Remember that this function modifies the original deck by removing the chosen cards
const chooseRandomCardsFromDeck = (deck, amount) => {
  const chosenCards = [];
  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    chosenCards.push(deck[randomIndex]);
    deck.splice(randomIndex, 1);
  }
  return chosenCards;
};

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

  // Generate deck of cards and shuffle it
  const colors = ['H', 'D', 'C', 'S'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  let deck = [];

  for (const color of colors) {
    for (const rank of ranks) {
      deck.push(`${rank}${color}`);
    }
  }
  deck = shuffleDeck(deck);

  // Insert the new game into the database
  query = {
    text: `INSERT INTO games (code, players_amount, time_for_move, small_blind_value, initial_balance, cards, small_blind_seat, big_blind_seat)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    values: [code, playersAmount, timeForMove, smallBlindValue, initialBalance, deck, 0, 1]
  }

  const gameResult = await pool.query(query);
  const gameId = gameResult.rows[0].id;

  // Insert the host player into the database
  query = {
  text: `INSERT INTO players (username, game_id, seat, balance)
  VALUES ($1, $2, $3, $4)`,
  values: [hostUsername, gameId, 0, initialBalance],
  }
  await pool.query(query);
}


async function joinGame(username, gameCode) {
  if (!(await checkIfGameExists(gameCode))) {
    return "Gra z takim kodem nie istnieje";
  } else {
    // Get the game
    let query = {
      text: `SELECT * FROM games WHERE code = $1`,
      values: [gameCode]
    }
    const game = await pool.query(query).then(res => res.rows[0]);
    
    // Check if there is a free seat in the game
    query = {
      text: `SELECT * FROM players WHERE game_id = $1`,
      values: [game.id]
    };
    const playersAmount = await pool.query(query).then(res => res.rows.length);
    if (playersAmount >= game.players_amount) {
      return "Ta gra jest już pełna";
    }

    // Insert the new player
    query = {
      text: `INSERT INTO players (username, game_id, seat, balance) VALUES ($1, $2, $3, $4)`,
      values: [username, game.id, playersAmount, game.initial_balance]
    };
    return await pool.query(query);
  }
}

/* TODO:
1. Betting
2. Folding
3. Checking
4. Small and big blind
5. Moving to the next turn
*/

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
    const cards = chooseRandomCardsFromDeck(deck, 2);
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
  await pool.query(query);
}

async function startGame(gameCode) {
  // Give cards to players
  await BetBlinds(gameCode);
  await GiveCardsToPlayers(gameCode);
}

// Eksportujemy funkcję do wykonywania zapytań
export { pool };