'use client'
import Player from "./elements/Player";
import RaiseBtn from "./elements/RaiseBtn";
import FoldBtn from "./elements/FoldBtn";
import AllInBtn from "./elements/AllInBtn";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Timer from "./elements/timer";


import CheckBtn from "./elements/CheckBtn";

const game = {
	mainPot: 100,
	sidePots: [100,100,100]
}

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
		<div className="min-h-screen w-full bg-radial-[at_50%_55%] from-gray-400 from-20% via-gray-600 via-55% to-gray-900 flex items-center justify-center p-4 relative">
			{/* Główny kontener gry */}
			<div className="absolute flex flex-row gap-2 bottom-0 left-0 z-1 m-2">
				<RaiseBtn show={true} />
				<CheckBtn show={true}/>
			</div>
			<div className="relative w-10/11 flex items-center justify-center">
				{/* Gracze po lewej (8 i 7) */}
				<div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
					<Player name="Gracz 8" position="left" balance={120} isAllIn={false} />
					<Player name="Gracz 7" position="left" balance={10} isAllIn={false} />
				</div>

				{/* Środek: Góra, Stół, Dół */}
				<div className="flex-1 flex flex-col items-center">
					{/* Gracze na górze (1 i 2) */}
					<div className="flex justify-evenly w-full max-w-2xl gap-4">
						<Player name="Gracz 1" balance={100} isAllIn={false} />
						<Player name="Gracz 2" blind="small" />
					</div>

					{/* STÓŁ */}
					<div className="w-full aspect-2/1 grow flex items-center justify-center p-2 md:p-4 mt-[4vh]">
						<div className="aspect-2/1 w-full border-amber-900 border-4 lg:border-6 bg-radial-[at_35%_35%] from-gray-500 to-black rounded-[50px] lg:rounded-[80px] p-3 lg:p-6 shadow-2xl">
							<div className="flex flex-col justify-center items-center w-full h-full bg-radial-[at_35%_35%] from-green-600 to-green-950 rounded-[40px] gap-6">
								<div>
									<div className="text-white text-3xl text-center">
										<h1 className="font-bold">Main pot</h1>
										<p>${game.mainPot}</p>
									</div>
									<div className="flex gap-3">
										{game.sidePots.map((value, index) => (
											<div key={index} className="text-gray-300 text-md text-center">
												<h1 className="font-bold">Side pot {index+1}</h1>
												<p>${value}</p>
											</div>
										))}
									</div>
								</div>

								<div className="flex gap-1">
									<div className="w-[5vw] h-[15vh]">
										<img src="/images/karty/BackCard.png"></img>
									</div>
									<div className="w-[5vw] h-[15vh]">
										<img src="/images/karty/BackCard.png"></img>
									</div>
									<div className="w-[5vw] h-[15vh]">
										<img src="/images/karty/BackCard.png"></img>
									</div>
									<div className="w-[5vw] h-[15vh]">
										<img src="/images/karty/BackCard.png"></img>
									</div>
									<div className="w-[5vw] h-[15vh]">
										<img src="/images/karty/BackCard.png"></img>
									</div>
								</div>

							</div>
						</div>
					</div>

					{/* Gracze na dole (5 i 6) */}
					<div className="flex justify-evenly w-full max-w-2xl gap-4">
						<Player name="Gracz 6" position="down" cards={["3Pik", "queenKier"]} balance={10} isAllIn={false} />
						<Player name="Gracz 5" position="down" balance={48} isFolded={false} />
					</div>
				</div>

				{/* Gracze po prawej (3 i 4) */}
				<div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
					<Player name="Gracz 3" position="right" blind="big" />
					<Player name="Gracz 4" position="right" />
				</div>
			</div>
			<div className="absolute flex flex-row bottom-0 right-0 gap-2 z-1 m-2">
				<FoldBtn show={true}/>
				<AllInBtn show={true}/>
			</div>
		</div>
	);
}