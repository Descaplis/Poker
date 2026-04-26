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

const translateRank = (rank) => {
  switch (rank) {
    case "Straight Flush":
      return "Poker";
    case "Five of a Kind":
      return "Piątka";
    case "Four of a Kind with Pair or Better":
      return "Kareta z parą lub czymś lepszym";
    case "Four of a Kind":
      return "Kareta";
    case "Four Wild Cards":
      return "Kareta";
    case "Three of a Kind with Two Pair":
      return "Trójka z dwoma parami";
    case "Full House":
      return "Full";
    case "Flush":
      return "Kolor";
    case "Straight":
      return "Strit";
    case "Two Three Of a Kind":
      return "Dwie trójki";
    case "Three of a Kind":
      return "Trójka";
    case "Three Pair":
      return "Trzy pary";
    case "Two Pair":
      return "Dwie pary";
    case "Pair":
      return "Para";
    case "High Card":
      return "Wysoka karta"
  }
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

  // raise panel state
  const [raiseAmount, setRaiseAmount] = useState(0);

  // game over data
  const [gameOverData, setGameOverData] = useState(null);
  const [gameOverPlayers, setGameOverPlayers] = useState([]);

  // hand over
  const [handWinners, setHandWinners] = useState([]);

  //  session data
  const [myId, setMyId] = useState(null);
  const [gameCode, setGameCode] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // data about current turn
  const myPlayer = players.find((p) => String(p.id) === String(myId)) || null;
  const isMyTurn = myPlayer != null && currentTurnSeat != null && Number(myPlayer.seat) === Number(currentTurnSeat) && !myPlayer.is_folded && !myPlayer.hasGoneAllIn;
  const maxRaise = myPlayer?.balance ?? 0;


  // useEffect for setting session data
  useEffect(() => {
    const savedId = sessionStorage.getItem("playerId");
    const savedGameCode = sessionStorage.getItem("code");
    if (savedId) {
      setMyId(savedId);
      setGameCode(savedGameCode);
    }
    setIsMounted(true);
  }, []);

  // useEffect for setting up socket.io
  useEffect(() => {
    if (!isMounted || !myId || !gameCode) return;

    const socketConn = io("http://" + window.location.hostname + ":8080");
    socketConn.on("connect", () => {
      socketConn.emit("auth", myId);
    });
    setSocket(socketConn);
    return () => {
      socketConn.disconnect();
    };
  }, [isMounted, myId, gameCode]);
  
  const fetchAll = useCallback(async () => {
    if (!gameCode) return;
    try {
      const base = `http://${window.location.hostname}:8080`;

      const [rPlayers, rSeat, rBet, rCards, rPots, rSmall, rBig, rEndTime] = await Promise.all([
        axios.post(`${base}/getListOfPlayers`,   { code: gameCode }),
        axios.post(`${base}/getCurrentTurnSeat`, { code: gameCode }),
        axios.post(`${base}/getCurrentBet`,      { code: gameCode }),
        axios.post(`${base}/getCardsOnTable`,    { code: gameCode }),
        axios.post(`${base}/getPots`,            { code: gameCode }),
        axios.post(`${base}/getSmallBlindSeat`,  { code: gameCode }),
        axios.post(`${base}/getBigBlindSeat`,    { code: gameCode }),
        axios.post(`${base}/getTurnEndTime`,    { code: gameCode }),
      ]);
      console.log("currentTurnSeat:", rSeat.data.seat);
      console.log("player seats:", rPlayers.data.players.map(p => ({ seat: p.seat , username: p.username})));
      console.log("endTime z API:", rEndTime.data.endTime);

      setPlayers(rPlayers.data.players ?? []);
      setCurrentTurnSeat(rSeat.data.seat);
      setCurrentBet(rBet.data.currentBet ?? 0);
      setCardsOnTable(rCards.data.cards ?? []);
      setPots(rPots.data.pots ?? []);
      setSmallBlindSeat(rSmall.data.seat);
      setBigBlindSeat(rBig.data.seat);
      setTimerEndTime(rEndTime.data.endTime ?? undefined);
    } catch (e) {
      console.error('fetchAll error', e);
    }
  }, [gameCode, myId]);

  // useEffect for setting up socket listeners and fetching initial data
  useEffect(() => {
    if (!socket) return;

    socket.on("next_turn", async (data) => {
      console.log(`[WS] next_turn — timer kończy się: ${new Date(data.endTime).toLocaleTimeString()}`);
      await fetchAll();
    });

    socket.on("next_round", async () => {
      console.log(`[WS] next_round — karty na stole aktualizowane`);
      await fetchAll();
    });

    socket.on("player_moved", (data) => {
      console.log(`[WS] player_moved — Gracz ${data.playerId} wykonał: ${data.action}${data.raiseValue ? ` (${data.raiseValue})` : ''}`);
    });

    socket.on("hand_over", async (data) => {
      console.log("[WS] hand_over — zwycięzcy rozdania:", data.winners);
      await fetchAll();
      setHandWinners(data.winners);
      setTimeout(() => {
        setHandWinners([]);
      }, 10000);
    });

    socket.on("game_over", async (data) => {
      console.log("KONIEC GRY", data);
      setGameOverPlayers(players);
      setGameOverData(data);
      await fetchAll();
    });

    socket.on("player_disconnected", async (data) => {
      alert(`Gracz ${data.username} rozłączył się.`);
      await fetchAll();
    });

    // First fetch
    fetchAll();
  }, [socket]);


  const handleMove = useCallback((action, raiseValue) => {
    if (!socket || !myId || !gameCode) return;
    socket.emit("move", { action, gameCode, playerId: myId, raiseValue });
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
    const isWinner = handWinners.some(w => w.id === player.id);
    const isShowdown = handWinners.length > 0;

    let cards;
    if (player.cards?.length && (isMe || isShowdown || gameOverData)) {
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
      isWinner: isWinner,
      blind: player.seat == smallBlindSeat ? "small" : 
      player.seat == bigBlindSeat ? "big" :
      undefined,
      endTime: isCurrentTurn ? timerEndTime : undefined
    }
  }
  
  const mainPot = pots.find((p) => p.pot_type == "MAIN");
  const sidePots = pots.filter((p) => p.pot_type == "SIDE");
  const tableCards = convertCardNames(cardsOnTable);

  // Don't render anything until we know the player's ID and game code (errors with sessionStorage = null)
  if (!isMounted) {
    return <div className="min-h-screen w-full bg-radial-[at_50%_55%] from-gray-400 from-20% via-gray-600 via-55% to-gray-900 flex items-center justify-center p-4 relative">
      <p className="text-white text-center mt-20">Ładowanie...</p>
    </div>;
  }

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

      {/* Hand finished - baner with the winner */}
      {handWinners.length > 0 && !gameOverData && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 pointer-events-none">
          <div className="bg-black/80 border-2 border-amber-400 rounded-2xl px-8 py-4 text-center shadow-2xl">
            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-1">
              {handWinners.length === 1 ? "Zwycięzca rozdania" : "Zwycięzcy rozdania"}
            </p>
            {handWinners.map((w, i) => (
              <div key={i}>
                <span className="text-white text-2xl font-black">{w.username}</span>
                {w.rank && (
                  <span className="text-amber-300 text-base ml-2">({translateRank(w.rank)})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raise and check buttons */}
			<div className="absolute flex flex-row gap-2 bottom-0 left-0 z-1 m-2">
				<RaiseBtn show={isMyTurn} maxRaise={maxRaise} raiseAmount={raiseAmount} setRaiseAmount={setRaiseAmount} onClick={handleMove} />
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
                          <p>${pot.value}</p>
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