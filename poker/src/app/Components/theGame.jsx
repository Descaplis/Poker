'use client'
import Player from "./elements/Player";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Timer from "./elements/timer";



export default function theGame() {
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [timerEndTime, setTimerEndTime] = useState();
  const [currentBet, setCurrentBet] = useState();
  const [smallBlindSeat, setSmallBlindSeat] = useState();
  const [bigBlindSeat, setBigBlindSeat] = useState();
  const [cardsOnTable, setCardsOnTable] = useState([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState();
  const [pots, setPots] = useState([]);
  const [gameOverData, setGameOverData] = useState(null);
  console.log(sessionStorage);
  const myId = sessionStorage.getItem("playerId");
  const gameCode = sessionStorage.getItem("code");


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

  const fetchAll = useCallback(async () => {
    if (!gameCode) return;
    try {
      const base = `http://${window.location.hostname}:8080`;

      const [rPlayers, rSeat, rBet, rCards, rPots] = await Promise.all([
        axios.post(`${base}/getListOfPlayers`, { code: gameCode }),
        axios.post(`${base}/getCurrentTurnSeat`, { code: gameCode }),
        axios.post(`${base}/getCurrentBet`, { code: gameCode }),
        axios.post(`${base}/getCardsOnTable`, { code: gameCode }),
        axios.post(`${base}/getPots`, { code: gameCode }),
      ]);

      setPlayers(rPlayers.data.players ?? []);
      setCurrentTurnSeat(rSeat.data.seat);
      setCurrentBet(rBet.data.currentBet ?? 0);
      setCardsOnTable(rCards.data.cards ?? []);
      setPots(rPots.data.pots ?? []);
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
    if (socket == null) return;

    socket.on("next_turn", async (data) => {
      console.log(`Następna tura, timer: ${data.endTime}`);
      setTimerEndTime(data.endTime);
      await fetchAll();
    });

    socket.on("next_round", async () => {
      console.log('Nowa runda — karty na stole aktualizowane');
      await fetchAll();
    });

    socket.on("player_moved", (data) => {
      console.log(`Gracz ${data.playerId} wykonał: ${data.action}${data.raiseValue ? ` (${data.raiseValue})` : ''}`);
    });

    socket.on("game_over", (data) => {
      console.log(`Koniec gry! Zwycięzcy: ${data.winners.map(w => w.username).join(', ')}`);
      setGameOverData(data);
      fetchAll();
    });

    socket.on("refresh_list", fetchAll);

    // First fetch
    fetchAll();

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const handleMove = useCallback((action, raiseValue) => {
    if (!socket || !myId || !gameCode) return;
    addLog(`Wysyłam ruch: ${action}${raiseValue ? ` (${raiseValue})` : ''}`);
    socket.emit("move", { action, gameCode, playerId: myId, raiseValue });
  }, [socket, myId, gameCode]);

  return (
    <div className="min-h-screen w-full bg-radial-[at_50%_55%] from-sky-200 via-blue-400 to-indigo-900 flex items-center justify-center p-4">
      <Timer endTime={timerEndTime}/>
      <button onClick={handleMove} className="bg-amber-800 text-white">Next turn</button>
      {/* Główny kontener gry */}
      <div className="relative w-11/12 flex items-center justify-center">
        {/* Gracze po lewej (8 i 7) */}
        <div className="flex flex-col justify-around h-[60vh] md:h-[50vh]">
          {players.length > 6 && <Player name={players[6].username} balance={players[6].balance} cards={myId == players[6].id ? myCards : null}/>}

          {players.length > 7 && <Player name={players[7].username} balance={players[7].balance} cards={myId == players[7].id ? myCards : null}/>}
        </div>

        {/* Środek: Góra, Stół, Dół */}
        <div className="flex-1 flex flex-col items-center gap-8">
          {/* Gracze na górze (1 i 2) */}
          <div className="flex justify-evenly w-full max-w-2xl gap-4">
          {players.length > 0 && <Player name={players[0].username} balance={players[0].balance} cards={myId == players[0].id ? myCards : null}/>}

          {players.length > 1 && <Player name={players[1].username} balance={players[1].balance} cards={myId == players[1].id ? myCards : null}/>}
          </div>

          {/* STÓŁ */}
          <div className="w-full aspect-2/1 grow flex items-center justify-center  p-2 md:p-4">
            <div className="aspect-2/1 w-full border-amber-900 border-4 lg:border-14 bg-radial-[at_35%_35%] from-gray-500 to-black rounded-[50px] lg:rounded-[100px] p-3 lg:p-6 shadow-2xl">
              <div className="w-full h-full bg-radial-[at_35%_35%] from-green-600 to-green-800 rounded-[40px]">
                <p className="text-white font-bold">MIEJSCE NA KARTY</p>
              </div>
            </div>
          </div>

          {/* Gracze na dole (5 i 6) */}
          <div className="flex justify-evenly w-full max-w-2xl gap-4">
          {players.length > 5 && <Player name={players[5].username} balance={players[5].balance} cards={myId == players[5].id ? myCards : null}/>}

          {players.length > 4 && <Player name={players[4].username} balance={players[4].balance} cards={myId == players[4].id ? myCards : null}/>}
          </div>
        </div>

        {/* Gracze po prawej (3 i 4) */}
        <div className="flex flex-col justify-around h-[60vh] md:h-[50vh]">
          {players.length > 2 && <Player name={players[2].username} balance={players[2].balance} cards={myId == players[2].id ? myCards : null}/>}

          {players.length > 3 && <Player name={players[3].username} balance={players[3].balance} cards={myId == players[3].id ? myCards : null}/>}
        </div>
      </div>
    </div>
  );
}