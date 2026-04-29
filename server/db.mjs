
import { Pool, Query } from 'pg';
import dotenv from 'dotenv';
import e, { text } from 'express';
import pokersolver from 'pokersolver';
const { Hand } = pokersolver;
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

async function CreatePotsTable() {
  let query = `
  CREATE TABLE IF NOT EXISTS pots(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  pot_type VARCHAR(4) NOT NULL DEFAULT 'MAIN',
  value INT NOT NULL
  )`;
  return await pool.query(query);
}
await CreatePotsTable();

async function CreatePotPlayersTable() {
  let query = `
  CREATE TABLE IF NOT EXISTS pot_players(
  pot_id UUID REFERENCES pots(id),
  player_id UUID,
  PRIMARY KEY (pot_id, player_id)
  )`;
  return await pool.query(query);
}
await CreatePotPlayersTable();


async function CreatePlayersTable() {
  let query = 
  `CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(25) NOT NULL,
  isHost BOOLEAN NOT NULL,
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
await CreatePlayersTable();

async function CreateGamesTable() {
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
  current_turn_seat INT,
  turn_end_time BIGINT
  )`;
  return await pool.query(query);
}
await CreateGamesTable();

async function CheckIfGameExists(code) {
  const query = "SELECT * FROM games WHERE code = $1";
  const res = await pool.query(query, [code]);
  return res.rows.length > 0;
}

async function CheckIfUsernameTaken(username, game) {
  username = username.trim();
  const query = {
    text: `SELECT players.id FROM players JOIN games ON players.game_id = games.id WHERE players.username = $1 AND games.code = $2`,
    values: [username, game.code]
  };
  const res = await pool.query(query);
  return res.rows.length > 0;
}

const CreateDeck = () => {
  const colors = ['h', 'd', 'c', 's'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  let deck = [];

  for (const color of colors) {
    
    for (const rank of ranks) {
      deck.push(`${rank}${color}`);
    }
  }
  return ShuffleDeck(deck);
}

const ShuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Remember that this function modifies the original deck by removing the chosen cards
const DrawCardsFromDeck = (deck, amount) => deck.splice(0, amount);

async function CreateGame(playersAmount, timeForMove, smallBlindValue, initialBalance, hostUsername) {
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

  const deck = CreateDeck();

  // Insert the new game into the database
  query = {
    text: `INSERT INTO games (code, players_amount, time_for_move, small_blind_value, initial_balance, cards, small_blind_seat, big_blind_seat, current_turn_seat, cards_on_table)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING code, id`,
    values: [code, playersAmount, timeForMove, smallBlindValue, initialBalance, deck, 0, 1, 0, []]
  }

  const game = await pool.query(query).then(res => res.rows[0]);

  // Insert the host player into the database
  query = {
  text: `INSERT INTO players (username, game_id, seat, balance, isHost)
  VALUES ($1, $2, $3, $4, $5) RETURNING id, username`,
  values: [hostUsername, game.id, 0, initialBalance, true],
  }
  const player = await pool.query(query);
  return {code: code, playerId: player.rows[0].id, username: player.rows[0].username};
}


async function JoinGame(username, gameCode) {
  const cleanUsername = username.trim();

  if (!(await CheckIfGameExists(gameCode))) {
    return { success: false, message: "Gra z takim kodem nie istnieje" };
  }

  const gameQuery = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  };
  const game = await pool.query(gameQuery).then(res => res.rows[0]);

  if (await CheckIfUsernameTaken(cleanUsername, game)) {
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
      text: `INSERT INTO players (username, game_id, seat, balance, isHost) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      values: [cleanUsername, game.id, playersAmount, game.initial_balance, false]
    };
    const result = await pool.query(insertQuery);
    return { success: true, playerId: result.rows[0].id };
  } catch (err) {
    return { success: false, message: err };
  }
}

async function LeaveGame(playerId) {
  const query = {
    text: `DELETE FROM players WHERE id = $1`,
    values: [playerId]
  }
  return await pool.query(query);
}

async function BetBlinds(gameCode) {
  // Get the game
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Get the players
  query = {
    text: `SELECT * FROM players WHERE game_id = $1 AND (seat = $2 OR seat = $3) AND balance > 0`,
    values: [game.id, game.small_blind_seat, game.big_blind_seat]
  }
  const players = await pool.query(query).then(res => res.rows);
  
  // Bet the blinds
  for (const player of players) {
    if (Number(player.balance <= 0)) continue;
    const wantedBet = player.seat == game.small_blind_seat ? game.small_blind_value : game.small_blind_value * 2;
    const actualBet = Math.min(wantedBet, Number(player.balance));
    const newBalance = Number(player.balance) - actualBet;
    const isAllIn = newBalance == 0;

    await pool.query(
      `UPDATE players SET bet = $1, balance = $2, hasGoneAllIn = $3, last_move = 'blind' WHERE game_id = $4 AND seat = $5`,
      [actualBet, newBalance, isAllIn, game.id, player.seat]
    );
  }

  query = {
    text: `UPDATE games SET current_bet = $1 WHERE id = $2`,
    values: [game.small_blind_value * 2, game.id]
  };
  await pool.query(query);

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
    text: `SELECT * FROM players WHERE game_id = $1 AND balance > 0`,
    values: [game.id]
  }
  const players = await pool.query(query).then(res => res.rows);

  let deck = game.cards;

  // Give 2 cards to each player
  for (const player of players) {
    const cards = DrawCardsFromDeck(deck, 2);
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
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);
  const deck = game.cards;
  const newCardsOnTable = DrawCardsFromDeck(deck, amount);

  // Update cards on table
  query = {
    text: `UPDATE games SET cards_on_table = cards_on_table || $1, cards = $2 WHERE id = $3`,
    values: [newCardsOnTable, deck, game.id]
  }
  return await pool.query(query);
}

async function updateSeats(gameCode) {
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);
  query = {
    text: 
    `UPDATE players
    SET seat = subquery.new_seat
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY seat) - 1 AS new_seat
        FROM players
        WHERE game_id = $1
    ) AS subquery
    WHERE players.id = subquery.id;`,
    values: [game.id]
  }
  return await pool.query(query);
}

async function startGame(gameCode) {
  // Ensure that player seats are well set (in case some players left the game before it started)
  await updateSeats(gameCode);
  await GiveCardsToPlayers(gameCode);
  await BetBlinds(gameCode);
  
  // Set first turn to player after big blind
  const game = await pool.query(
    `SELECT * FROM games WHERE code = $1`, [gameCode]
  ).then(res => res.rows[0]);
  
  const firstTurnSeat = (Number(game.big_blind_seat) + 1) % Number(game.players_amount);
  const turnEndTime = Date.now() + game.time_for_move * 1000;

  await pool.query(
    `UPDATE games SET current_turn_seat = $1, turn_end_time = $2, status = 'playing' WHERE id = $3`,
    [firstTurnSeat, turnEndTime, game.id]
  );
  // wait for players to make their moves, then put cards on table and so on
}

async function Raise(gameCode, playerId, raiseAmount) {
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
      text: `SELECT id, balance, bet FROM players WHERE id = $1 FOR UPDATE`,
      values: [playerId]
    };
    const player = await client.query(query).then(res => res.rows[0]);

    if (!player) throw new Error("Nie znaleziono gracza.");

    const currentBet = Number(game.current_bet);
    const playerBet = Number(player.bet);
    const balance = Number(player.balance);

    // raiseAmount - how much money player wants to bet (not how much he wants the total bet to bet
    const targetBet = currentBet + Number(raiseAmount);
    const amountToPut = Math.min(targetBet - playerBet, balance);
    const newPlayerBet = playerBet + amountToPut;
    const newBalance = balance - amountToPut;
    const isAllIn = newBalance == 0;
    const newCurrentBet = Math.max(currentBet, newPlayerBet);

    query = {
      text: `UPDATE players SET bet = $1, balance = $2, hasGoneAllIn = $3, last_move = 'raise' WHERE id = $4`,
      values: [newPlayerBet, newBalance, isAllIn, playerId]
    };
    await client.query(query);

    query = {
      text: `UPDATE games SET current_bet = $1 WHERE id = $2`,
      values: [newCurrentBet, game.id]
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

async function Fold(gameCode, playerId) {
  // in case the game finishes timer for a all-in player and it fold automatically
  const player = await pool.query(`SELECT * FROM players WHERE id = $1`, [playerId]).then(res => res.rows[0]); 
  if (player.hasGoneAllIn) return;

  const query = {
    text: `UPDATE players SET is_folded = TRUE, last_move = 'fold' WHERE id = $1`,
    values: [playerId]
  }
  await pool.query(query);

  return await NextTurn(gameCode);
}

async function Check(gameCode, playerId) {
  // Get the game
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  const currentBet = Number(game.current_bet);
  query = {
    text: `SELECT * FROM players WHERE id = $1`, 
    values: [playerId]
  }
  const player = await pool.query(query).then(res => res.rows[0]);
  const playerBet = Number(player.bet);
  const playerBalance = Number(player.balance);

  if (currentBet === 0 || playerBet === currentBet) {
    let query = { 
      text: `UPDATE players SET last_move = 'check' WHERE id = $1`,
      values: [playerId] 
    };
    await pool.query(query);
  } else {
    const difference = currentBet - playerBet;
    if (playerBalance <= difference) {
      // All in
      query = {
        text: `UPDATE players SET bet = bet + balance, balance = 0, hasGoneAllIn = TRUE, last_move = 'allin' WHERE id = $1`,
        values: [playerId]
      };
      await pool.query(query);
    } else {
      // Call
      query = {
        text: `UPDATE players SET bet = $1, balance = balance - $2, last_move = 'call' WHERE id = $3`,
        values: [currentBet, difference, playerId]
      }
      await pool.query(query);
    }
  }

  return await NextTurn(gameCode);
}

async function NextTurn(gameCode) {
  // Get the game
  let query = {
    text: `SELECT * FROM games WHERE code = $1`,
    values: [gameCode]
  }
  const game = await pool.query(query).then(res => res.rows[0]);

  // Determine the next turn seat
  query = { 
    text: `SELECT * FROM players WHERE game_id = $1 ORDER BY seat ASC`,
    values: [game.id]
  };
  const players = await pool.query(query).then(res => res.rows);
  let nextTurnSeat = (Number(game.current_turn_seat) + 1) % players.length;

  let checked = 0;
  let found = false;
  while (checked < players.length) {
    const candidate = players.find(p => p.seat === nextTurnSeat);

    if (candidate && !candidate.is_folded && !candidate.hasGoneAllIn && Number(candidate.balance > 0)) {
      // finishing round if the only player with a move is the one who just made it
      if (nextTurnSeat == Number(game.current_turn_seat)) {
        break;
      }
      found = true;
      break;
    }
    nextTurnSeat = (nextTurnSeat + 1) % players.length;
    checked++;
  }

  if (found) {
    await pool.query(`UPDATE games SET current_turn_seat = $1 WHERE id = $2`, [nextTurnSeat, game.id]);
  }

  await pool.query(query);
  return await EndRoundIfCan(game);
}

async function ResolvePots(gameId) {
  const players = await pool.query(
    `SELECT id, bet, hasGoneAllIn, is_folded FROM players WHERE game_id = $1 ORDER BY bet ASC`,
    [gameId]
  ).then(res => res.rows);

  if (players.length === 0) return;
  // deleting folded players from all pots
  const foldedPlayers = players.filter(p => p.is_folded);
  for (const fp of foldedPlayers) {
    await pool.query(`DELETE FROM pot_players WHERE player_id = $1`, [fp.id]);
  }

  // get current pots and their players
  //  deleted ORDER BY CASE WHEN pot_type = 'MAIN' THEN 0 ELSE 1 END ASC, value ASC, maybe should bring it back later
  const existingPots = await pool.query(
    `SELECT * FROM pots WHERE game_id = $1`,
    [gameId]
  ).then(res => res.rows);

  for (let pot of existingPots) {
    const potPlayers = await pool.query(`SELECT player_id FROM pot_players WHERE pot_id = $1`, [pot.id]);
    pot.playerIds = potPlayers.rows.map(r => r.player_id);
  }

  // dividing current bets from current round into levels
  let lastLevel = 0;
  const levels = [...new Set(players.map(p => Number(p.bet)).filter(b => b > 0))].sort((a, b) => a - b);

  for (const level of levels) {
    const contributionPerPlayer = level - lastLevel;
    let potValue = 0;
    let eligiblePlayerIds = [];

    players.forEach(p => {
      if (Number(p.bet) >= level) {
        potValue += contributionPerPlayer;
        if (!p.is_folded) {
          eligiblePlayerIds.push(p.id);
        }
      }
    });

    // checking if there already is a pot for these players
    let matchingPot = existingPots.find(pot => 
      pot.playerIds.length === eligiblePlayerIds.length &&
      pot.playerIds.every(id => eligiblePlayerIds.includes(id))
    );

    if (matchingPot) {
      // The same players play for this cash - adding value to current pot
      await pool.query(`UPDATE pots SET value = value + $1 WHERE id = $2`, [potValue, matchingPot.id]);
      matchingPot.value = Number(matchingPot.value) + potValue;
      console.log(`[ResolvePots] Dodano ${potValue} do pota ${matchingPot.pot_type} (id: ${matchingPot.id})`);
    } else {
      // Players changed (someone went all-in) - making new pot
      const type = existingPots.length == 0 ? "MAIN" : "SIDE";

      const newPot = await pool.query(
        `INSERT INTO pots (game_id, value, pot_type) VALUES ($1, $2, $3) RETURNING id`,
        [gameId, potValue, type]
      );
      const newPotId = newPot.rows[0].id;

      for (const pid of eligiblePlayerIds) {
        await pool.query(`INSERT INTO pot_players (pot_id, player_id) VALUES ($1, $2)`, [newPotId, pid]);
      }

      // adding new pot to local table, so that next levels could fin it
      existingPots.push({
        id: newPotId,
        game_id: gameId,
        value: potValue,
        pot_type: type,
        playerIds: eligiblePlayerIds
      });
      console.log(`[ResolvePots] Stworzono nowy pot ${type} o wartości ${potValue}`);
    }

    lastLevel = level;
  }
}

async function EndRoundIfCan(game) {
  // Get the players
  let query = {
    text: `SELECT * FROM players WHERE game_id = $1`,
    values: [game.id]
  }
  const players = await pool.query(query).then(res => res.rows);

  query = {
    text: `SELECT * FROM games WHERE id = $1`, 
    values: [game.id]
  };
  const freshGame = await pool.query(query).then(res => res.rows[0]);

  const currentBet = Number(freshGame.current_bet);
  const activePlayers = players.filter(player => !player.is_folded && (Number(player.balance) > 0 || player.hasGoneAllIn));
  
  // nowe
  const allPlayersActed = activePlayers.every(p =>
  (Number(p.bet) == currentBet || p.hasGoneAllIn)
  ) && activePlayers.every(p =>
    p.hasGoneAllIn || (p.last_move != null && p.last_move != 'blind')  // ← poprawna kolejność
  );
  const nonFoldedPlayers = players.filter(p => !p.is_folded);

  // Round ends when all active players have equal bet or are all-in or only one player didn't fold
  if (nonFoldedPlayers.length == 1 || allPlayersActed) {
    await ResolvePots(game.id);
    await pool.query(`UPDATE players SET bet = 0, last_move = NULL WHERE game_id = $1`, [freshGame.id]);

    // Resetting current turn seat to small blind before the next round
    const firstToAct = await FindFirstActivePlayer(game.id, freshGame.small_blind_seat);

    await pool.query(
      `UPDATE games SET current_bet = 0, current_turn_seat = $1 WHERE id = $2`,
      [firstToAct, game.id]
    );

    return await NextRoundOrEndGame(freshGame);
  }

  return {roundFinished: false};
}

async function FindFirstActivePlayer(gameId, startSeat) {
  const players = await pool.query(
    `SELECT * FROM players WHERE game_id = $1 ORDER BY seat ASC`, 
    [gameId]
  ).then(res => res.rows);

  let currentSeat = startSeat;
  let checked = 0;

  while (checked < players.length) {
    const candidate = players.find(p => p.seat === currentSeat);
    if (candidate && !candidate.is_folded && !candidate.hasGoneAllIn && Number(candidate.balance) > 0) {
      return currentSeat;
    }
    currentSeat = (currentSeat + 1) % players.length;
    checked++;
  }
  return startSeat;
}

async function NextRoundOrEndGame(game) {
  const freshGame = await pool.query(
    `SELECT * FROM games WHERE code = $1`, [game.code]
  ).then(res => res.rows[0]);

  const players = await pool.query(
    `SELECT * FROM players WHERE game_id = $1`, [freshGame.id]
  ).then(res => res.rows);
  const nonFolded = players.filter(p => !p.is_folded);

  // If it was the last round, determine the winner and end the game
  if (nonFolded.length == 1 || freshGame.cards_on_table.length == 5) {
    const result = await DetermineWinner(freshGame);
    return { roundFinished: true, winners: result.winners, gameOver: result.gameOver, handOver: result.handOver };
  }

  if (freshGame.cards_on_table.length === 0) {
    await PutCardsOnTable(freshGame.code, 3);
    return {roundFinished: true};
  }

  // Put cards on table and start next round
  await PutCardsOnTable(freshGame.code, 1);
  return {roundFinished: true};
}

async function DetermineWinner(game) {
  // Get the pots
  let winners;

  const client = await pool.connect();
  let uniqueWinners;
  try {
    await client.query("BEGIN");

    let query = {
      text: `SELECT * FROM pots WHERE game_id = $1`,
      values: [game.id]
    }
    const pots = await client.query(query).then(res => res.rows);
    console.log("Pots:", pots);

    query = {
      text: `SELECT * FROM games WHERE id = $1`,
      values: [game.id]
    }
    const freshGame = await client.query(query).then(res => res.rows[0]);

    let allWinners = [];
    for (const pot of pots) {
      // Find players who didn't fold
      query = {
        text: `SELECT p.* FROM players p
         JOIN pot_players pp ON p.id = pp.player_id
         WHERE pp.pot_id = $1 AND p.is_folded = FALSE`,
        values: [pot.id]
      }
      const eligiblePlayers = await client.query(query).then(res => res.rows);

      const nonFoldedEligiblePlayers = eligiblePlayers.filter(p => !p.is_folded);

      if (eligiblePlayers.length == 0) continue;
      if (nonFoldedEligiblePlayers.length == 1) {
        // Only one player didn't fold, he wins the whole pot
        winners = [{
            player: nonFoldedEligiblePlayers[0], 
            hand: { name: "Walkower (wszyscy pas)" } 
        }];
      } else {
        const playersHands = nonFoldedEligiblePlayers
        .map(player => {
          const hand = Hand.solve([...player.cards, ...freshGame.cards_on_table]);
          return { player, hand };
        });

        const winningHands = Hand.winners(playersHands.map(ph => ph.hand));
        winners = playersHands.filter(ph => winningHands.some(wh => wh == ph.hand));
      }

      allWinners.push(...winners);
      console.log("Winners:", winners);

      const share = Math.floor(pot.value / winners.length);
      const remainder = pot.value % winners.length;

      for (let i = 0; i < winners.length; i++) {
        const bonus = i == 0 ? remainder : 0;
        query = {
          text: `UPDATE players SET balance = balance + $1 WHERE id = $2`,
          values: [share + bonus, winners[i].player.id]
        }
        await client.query(query);
      }
    }

    uniqueWinners = allWinners.filter(
    (w, i, arr) => arr.findIndex(x => x.player.id === w.player.id) === i);

    if (pots.length === 0) {
      // Znajdź jedynego niesfoldowanego gracza
      const nonFolded = await client.query(
          `SELECT * FROM players WHERE game_id = $1 AND is_folded = FALSE`,
          [game.id]
      ).then(res => res.rows);
      uniqueWinners = nonFolded.map(p => ({ player: p, hand: { name: "Walkower" } }));
    }

    // Clear pots and reset players
    await client.query(`DELETE FROM pot_players WHERE pot_id IN (SELECT id FROM pots WHERE game_id = $1)`, [game.id]);
    await client.query(`DELETE FROM pots WHERE game_id = $1`, [game.id]);
    await client.query(`UPDATE players SET is_folded = FALSE, hasGoneAllIn = FALSE, bet = 0, cards = NULL, last_move = NULL WHERE game_id = $1`, [game.id]);
    await client.query(`UPDATE games SET cards_on_table = '{}', current_bet = 0 WHERE id = $1`, [game.id]);

    await client.query("COMMIT");
  } catch(e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  // Check if the whole game ends
  const remainingPlayers = await pool.query(
    `SELECT * FROM players WHERE game_id = $1 AND balance > 0`, [game.id]
  ).then(res => res.rows);

  if (remainingPlayers.length <= 1) {
    console.log("Koniec gry — tylko jeden gracz ma żetony");
    return { winners: uniqueWinners, gameOver: true };
  }

  // The game goes on, move the blinds and start new hand
  const allPlayers = await pool.query(
  `SELECT * FROM players WHERE game_id = $1 ORDER BY seat ASC`, [game.id]
  ).then(res => res.rows);

  const playerCount = allPlayers.length;
  const freshGame2 = await pool.query(
    `SELECT * FROM games WHERE id = $1`, [game.id]
  ).then(res => res.rows[0]);

  const nextSmallBlind = findNextActiveBlindSeat(Number(freshGame2.small_blind_seat), allPlayers);
  const nextBigBlind = findNextActiveBlindSeat(nextSmallBlind, allPlayers);

  // In first turn: player after big blind except the ones without balance
  let nextFirstTurn = (nextBigBlind + 1) % playerCount;
  for (let i = 0; i < playerCount; i++) {
    const candidate = allPlayers.find(p => p.seat === nextFirstTurn);
    if (candidate && Number(candidate.balance) > 0) break;
    nextFirstTurn = (nextFirstTurn + 1) % playerCount;
  }

  // New deck
  const newDeck = CreateDeck();
  await pool.query(
    `UPDATE games SET cards = $1, cards_on_table = '{}', current_bet = 0, small_blind_seat = $2, big_blind_seat = $3, current_turn_seat = $4 WHERE id = $5`,
    [newDeck, nextSmallBlind, nextBigBlind, nextFirstTurn, game.id]
  );

  await GiveCardsToPlayers(game.code);
  await BetBlinds(game.code);

  console.log(`Nowe rozdanie: smallBlind=${nextSmallBlind}, bigBlind=${nextBigBlind}, firstTurn=${nextFirstTurn}`);

  return { winners: uniqueWinners, allPlayersCards: allPlayers.map(p => ({id: p.id, cards: p.cards})), handOver: true };
}

const findNextActiveBlindSeat = (fromSeat, players) => {
  const count = players.length;
  let seat = (fromSeat + 1) % count;
  for (let i = 0; i < count; i++) {
    const candidate = players.find(p => p.seat === seat);
    if (candidate && Number(candidate.balance) > 0) return seat;
    seat = (seat + 1) % count;
  }
  return fromSeat; // fallback
  };

// FUNCTIONS TO GET CERTAIN VALUES

async function GetListOfPlayers(code) {
  let query = {
    text: `SELECT id FROM games WHERE code = $1`,
    values: [code]
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

async function GetCurrentTurnSeat(gameCode) {
  let query = {
    text: `SELECT current_turn_seat FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].current_turn_seat);
}

async function GetCurrentBet(gameCode) {
  let query = {
    text: `SELECT current_bet FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].current_bet);
}

async function GetTimeForMove(gameCode) {
  let query = {
    text: `SELECT time_for_move FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].time_for_move);
}

async function GetSmallBlindSeat(gameCode) {
  let query = {
    text: `SELECT small_blind_seat FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].small_blind_seat);
}

async function GetBigBlindSeat(gameCode) {
  let query = {
    text: `SELECT big_blind_seat FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].big_blind_seat);
}

async function GetCardsOnTable(gameCode) {
  let query = {
    text: `SELECT cards_on_table FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].cards_on_table);
}

async function GetUserById(playerId) {
  let query = {
    text: `SELECT * FROM players  WHERE id = $1`,
    values: [playerId]
  }
   return await pool.query(query).then(res => res.rows[0]);
}

async function GetGameById(gameId) {
  let query = {
    text: `SELECT * FROM games WHERE id = $1`,
    values: [gameId]
  }
   return await pool.query(query).then(res => res.rows[0]);
}

async function GetGameByCode(code) {
  return await pool.query({ text: `SELECT * FROM games WHERE code = $1`, values: [code] }).then(res => res.rows[0]);
}

// Nowy getter: pobiera poty z graczami dla danej gry
async function GetPots(gameCode) {
  const game = await GetGameByCode(gameCode);
  if (!game) return [];

  const pots = await pool.query(
    `SELECT * FROM pots WHERE game_id = $1 ORDER BY CASE WHEN pot_type = 'MAIN' THEN 0 ELSE 1 END ASC`,
    [game.id]
  ).then(res => res.rows);

  // Sum of current bets of all players during the game, which will be added to the main pot
  const currentBetsSum = await pool.query(
    `SELECT COALESCE(SUM(bet), 0) AS total FROM players WHERE game_id = $1`,
    [game.id]
  ).then(res => Number(res.rows[0].total));

  for (const pot of pots) {
    const players = await pool.query(
      `SELECT p.id, p.username FROM players p JOIN pot_players pp ON p.id = pp.player_id WHERE pp.pot_id = $1`,
      [pot.id]
    ).then(res => res.rows);
    pot.players = players;
  }

  if (pots.length === 0) {
    return [{pot_type: 'MAIN', value: currentBetsSum, players: []}];
  }

  // Add current bets to the main pot value, because they are not added to any pot yet
  pots[0].value = Number(pots[0].value) + currentBetsSum;

  return pots;
}

async function GetTurnEndTime(gameCode) {
  let query = {
    text: `SELECT turn_end_time FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].turn_end_time);
}

async function GetGameStatus(gameCode) {
  let query = {
    text: `SELECT status FROM games WHERE code = $1`,
    values: [gameCode]
  }
  return await pool.query(query).then(res => res.rows[0].status);
}

async function SetTurnEndTime(gameCode, endTime) {
  let query = {
    text: `UPDATE games SET turn_end_time = $1 WHERE code = $2`,
    values: [endTime, gameCode]
  }
  return await pool.query(query);
}

async function DeleteGame(gameCode) {
  const game = await GetGameByCode(gameCode);
  if (!game) return false;
  const gameId = game.id;
  await pool.query(`DELETE FROM pot_players WHERE pot_id IN (SELECT id FROM pots WHERE game_id = $1)`, [gameId]);
  await pool.query(`DELETE FROM pots WHERE game_id = $1`, [gameId]);
  await pool.query(`DELETE FROM players WHERE game_id = $1`, [gameId]);
  await pool.query(`DELETE FROM games WHERE id = $1`, [gameId]);
  return true;
}

export { CreateGame, JoinGame, LeaveGame, startGame, Raise, Check, Fold, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetCurrentBet, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable, GetUserById, GetGameById, GetTimeForMove, GetPots, GetTurnEndTime, GetGameStatus, SetTurnEndTime, DeleteGame };