'use client'
import Player from "./elements/Player";
import RaiseBtn from "./elements/RaiseBtn";
import CheckBtn from "./elements/CheckBtn";
import FoldBtn from "./elements/FoldBtn";
import AllInBtn from "./elements/AllInBtn";
import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Timer from "./elements/timer";

const game = {
	mainPot: 100,
	sidePots: [100,100,100]
}

const convertCardNames = (myCards) => {
  myCards = myCards.map((card) => {
    let realName = "";
    const ranksEquivalents = {
      T: "10",
      J: "jack",
      Q: "queen",
      K: "king",
      A: "as"
    };

    const colorsEquivalents = {
      h: "Kier",
      d: "Karo",
      c: "Trefl",
      s: "Pik"
    }

    if (Object.keys(ranksEquivalents).includes(card[0])) {
      realName = ranksEquivalents[card[0]];
    } else {
      realName = card[0];
    }

    realName += colorsEquivalents[card[1]];
    return realName;
  });
  return myCards;
}

export default function theGame() {
  const [socket, setSocket] = useState(null);
  // game state from backend
  const [players, setPlayers] = useState([]);
  const [cardsOnTable, setCardsOnTable] = useState([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState(null);
  const [currentBet, setCurrentBet] = useState(0);
  const [smallBlindSeat, setSmallBlindSeat] = useState(null);
  const [bigBlindSeat, setBigBlindSeat] = useState(null);
  const [pots, setPots] = useState([]);
  const [timerEndTime, setTimerEndTime] = useState(null);

  // game over data
  const [gameOverData, setGameOverData] = useState(null);

  // raise panel state
  const [raiseAmount, setRaiseAmount] = useState(0);

  //  session data
  console.log(sessionStorage);
  const myId = sessionStorage.getItem("playerId");
  const gameCode = sessionStorage.getItem("code");

  // data about current turn
  const myPlayer = players.find((p) => p.id === myId) ?? null;
  const isMyTurn = myPlayer?.seat === currentTurnSeat;
  const maxRaise = myPlayer?.balance ?? 0;
  const minRaise = Math.max(1, currentBet);

  const fetchAll = useCallback(async () => {
    if (!gameCode) return;
    try {
      const base = `http://${window.location.hostname}:8080`;

      const [rPlayers, rSeat, rBet, rCards, rPots, rSmall, rBig] = await Promise.all([
        axios.post(`${base}/getListOfPlayers`,   { code: gameCode }),
        axios.post(`${base}/getCurrentTurnSeat`, { code: gameCode }),
        axios.post(`${base}/getCurrentBet`,      { code: gameCode }),
        axios.post(`${base}/getCardsOnTable`,    { code: gameCode }),
        axios.post(`${base}/getPots`,            { code: gameCode }),
        axios.post(`${base}/getSmallBlindSeat`,  { code: gameCode }),
        axios.post(`${base}/getBigBlindSeat`,    { code: gameCode }),
      ]);

      setPlayers(rPlayers.data.players ?? []);
      setCurrentTurnSeat(rSeat.data.seat);
      setCurrentBet(rBet.data.currentBet ?? 0);
      setCardsOnTable(rCards.data.cards ?? []);
      setPots(rPots.data.pots ?? []);
      setSmallBlindSeat(rSmall.data.seat);
      setBigBlindSeat(rBig.data.seat);
    } catch (e) {
      console.error('fetchAll error', e);
    }
  }, [gameCode]);


  // useEffect for setting up socket.io
  useEffect(() => {
    const socketConn = io("http://" + window.location.hostname + ":8080");
    setSocket(socketConn);
  }, []);
  
  // useEffect for setting up socket listeners and fetching initial data
  useEffect(() => {
    if (!socket) return;

    socket.on("next_turn", async (data) => {
      console.log(`[WS] next_turn — timer kończy się: ${new Date(data.endTime).toLocaleTimeString()}`);
      setTimerEndTime(data.endTime);
      await fetchAll();
    });

    socket.on("next_round", async () => {
      console.log(`[WS] next_round — karty na stole aktualizowane`);
      await fetchAll();
    });

    socket.on("player_moved", (data) => {
      console.log(`[WS] player_moved — Gracz ${data.playerId} wykonał: ${data.action}${data.raiseValue ? ` (${data.raiseValue})` : ''}`);
    });

    socket.on("game_over", (data) => {
      console.log("══════════════════════════════");
      console.log("       KONIEC GRY 🏆          ");
      console.log("══════════════════════════════");
      data.winners.forEach((w) => {
        console.log(`  ★ ${w.username}${w.rank ? ` — ${w.rank}` : ""}`);
      });
      setGameOverData(data);
      fetchAll();
    });

    socket.on("refresh_list", fetchAll);

    // First fetch
    fetchAll();
  }, [socket]);

  const handleMove = useCallback((action, raiseValue) => {
    if (!socket || !myId || !gameCode) return;
    addLog(`Wysyłam ruch: ${action}${raiseValue ? ` (${raiseValue})` : ''}`);
    socket.emit("move", { action, gameCode, playerId: myId, raiseValue });
    setShowRaisePanel(false);
  }, [socket, myId, gameCode]);

  const getPlayerAtSeat = (seat) => players.find((p) => p.seat === seat) ?? null;

  // Helper: builds props for player component
  const buildPlayerProps = (seat, position) => {
    const player = getPlayerAtSeat(seat);

    // building placeholder for empty seat
    if (!player) {
      return {
        name: `Miejsce ${seat + 1}`,
        position,
        balance: 0,
        isFolded: true
      };
    }

    const isMe = player.id == myId;
    const isCurrentTurn = player.seat == currentTurnSeat;

    let cards;
    if (isMe && player.cards?.length) {
      cards = convertCardNames(player.cards);
    } else if (gameOverData && player.cards?.length) {
      cards = convertCardNames(player.cards);
    }

    return {
      name: player.username,
      position: position,
      balance: player.balance,
      bet: player.bet,
      cards: cards,
      isAllIn: player.hasGoneAllIn,
      isFolded: player.is_folded,
      isCurrentTurn: isCurrentTurn,
      blind: player.seat == smallBlindSeat ? "small" : 
      player.seat == bigBlindSeat ? "big" :
      undefined,
      endTime: isCurrentTurn ? timerEndTime : undefined
    }
  }
  
  const mainPot = pots.find((p) => p.pot_type == "MAIN");
  const sidePots = pots.filter((p) => p.pot_type == "SIDE");
  const tableCards = convertCardNames(cardsOnTable);

	return (
		<div className="min-h-screen w-full bg-radial-[at_50%_55%] from-gray-400 from-20% via-gray-600 via-55% to-gray-900 flex items-center justify-center p-4 relative">
      {/* Game over */}
      {gameOverData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-amber-500 rounded-2xl p-10 text-white max-w-md w-full text-center shadow-2xl">
            <h1 className="text-5xl font-black text-amber-400 mb-2">🏆</h1>
            <h2 className="text-3xl font-black text-amber-400 mb-6">Koniec gry!</h2>
            <p className="text-lg text-gray-300 mb-4">
              {gameOverData.winners.length === 1 ? "Zwycięzca:" : "Zwycięzcy:"}
            </p>
            {gameOverData.winners.map((w, i) => (
              <div key={i} className="mb-2">
                <span className="text-2xl font-bold text-green-400">{w.username}</span>
                {w.rank && (
                  <span className="text-gray-400 text-base ml-2">({w.rank})</span>
                )}
              </div>
            ))}
            <button
              onClick={() => setGameOverData(null)}
              className="mt-8 px-8 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* Raise and check buttons */}
			<div className="absolute flex flex-row gap-2 bottom-0 left-0 z-1 m-2">
				<RaiseBtn show={isMyTurn} minRaise={minRaise} maxRaise={maxRaise} raiseAmount={raiseAmount} setRaiseAmount={setRaiseAmount} />
				<CheckBtn show={isMyTurn} onClick={() => handleMove("check", undefined)}/>
			</div>

			{/* Main game container */}
			<div className="relative w-10/11 flex items-center justify-center">
				{/* Gracze po lewej (8 i 7) */}
				<div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
          <Player {...buildPlayerProps(7, "left")}/>
          <Player {...buildPlayerProps(6, "left")}/>
				</div>

				{/* Middle: top, table, down */}
				<div className="flex-1 flex flex-col items-center">
					{/* Gracze na górze (1 i 2) */}
					<div className="flex justify-evenly w-full max-w-2xl gap-4">
            <Player {...buildPlayerProps(0, undefined)}/>
            <Player {...buildPlayerProps(1, undefined)}/>
					</div>

					{/* TABLE */}
					<div className="w-full aspect-2/1 grow flex items-center justify-center p-2 md:p-4 mt-[4vh]">
						<div className="aspect-2/1 w-full border-amber-900 border-4 lg:border-6 bg-radial-[at_35%_35%] from-gray-500 to-black rounded-[50px] lg:rounded-[80px] p-3 lg:p-6 shadow-2xl">
							<div className="flex flex-col justify-center items-center w-full h-full bg-radial-[at_35%_35%] from-green-600 to-green-950 rounded-[40px] gap-6">
                {/* Pots */}
								<div>
									<div className="text-white text-3xl text-center">
										<h1 className="font-bold">Main pot</h1>
                    <p>${mainPot?.value ?? players.reduce((s, p) => s + (p.bet ?? 0), 0)}</p>
									</div>

                  {sidePots.length > 0 && (
                    <div className="flex gap-3">
                      {sidePots.map((pot, i) => (
                        <div key={i} className="text-gray-300 text-md text-center">
                          <h1 className="font-bold">Side pot {i+1}</h1>
                          <p>${pot}</p>
                        </div>
                      ))}
									  </div>
                  )}
								</div>

                {/* Cards on table */}
								<div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-[5vw] h-[15vh]">
                      {tableCards[i] ? (
                        // Odkryta karta
                        <img
                          src={`/images/karty/${tableCards[i]}.png`}
                          className="w-full h-full object-contain"
                          alt={`karta ${i + 1}`}
                        />
                      ) : (
                        // Zakryty slot
                        <img
                          src="/images/karty/BackCard.png"
                          className="w-full h-full object-contain opacity-25"
                          alt="zakryta"
                        />
                      )}
                    </div>
                  ))}
								</div>

							</div>
						</div>
					</div>

					{/* Gracze na dole (5 i 6) */}
					<div className="flex justify-evenly w-full max-w-2xl gap-4">
            <Player {...buildPlayerProps(5, "down")} />
            <Player {...buildPlayerProps(4, "down")} />
					</div>
				</div>

				{/* Gracze po prawej (3 i 4) */}
				<div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
          <Player {...buildPlayerProps(2, "right")} />
          <Player {...buildPlayerProps(3, "right")} />
				</div>
			</div>
			<div className="absolute flex flex-row bottom-0 right-0 gap-2 z-1 m-2">
        <FoldBtn
          show={isMyTurn}
          onClick={() => handleMove("fold", undefined)}
        />
        <AllInBtn
          show={isMyTurn}
          // All-in = raise o całe saldo gracza
          onClick={() => handleMove("raise", maxRaise)}
        />
			</div>
		</div>
	);
}