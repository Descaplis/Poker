'use client'
import Player from "./elements/Player";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Timer from "./elements/timer";

const socket = io("http://" + window.location.hostname + ":8080");

export default function theGame() {
  const [players, setPlayers] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [timerEndTime, setTimerEndTime] = useState();
  const [currentBet, setCurrentBet] = useState();
  const [smallBlindSeat, setSmallBlindSeat] = useState();
  const [bigBlindSeat, setBigBlindSeat] = useState();
  const [cardsOnTable, setCardsOnTable] = useState([]);
  const [currentTurnSeat, setCurrentTurnSeat] = useState();
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

  useEffect(() => {
    // start: players, small blind, big blind, current turn seat, timer
    const fetchDataOnStart = async () => {
      // players
      let res = await axios.post("http://" + window.location.hostname + ":8080/getListOfPlayers", {
        code: gameCode
      });
      const players = res.data.players;
      console.log(players);
      setPlayers(players);

      let myCards = players.filter((player) => player.id == myId)[0].cards;
      myCards = convertCardNames(myCards);
      setMyCards(myCards);
      console.log(myCards);

      // small blind seat
      res = await axios.post("http://" + window.location.hostname + ":8080/getSmallBlindSeat", {
        code: gameCode
      });
      setSmallBlindSeat(res.data.seat);

      // big blind seat
      res = await axios.post("http://" + window.location.hostname + ":8080/getBigBlindSeat", {
        code: gameCode
      });
      setBigBlindSeat(res.data.seat);

      // current turn seat
      res = await axios.post("http://" + window.location.hostname + ":8080/getCurrentTurnSeat", {
        code: gameCode
      });
      setCurrentTurnSeat(res.data.seat);

      // timer
      const timeForMove = await axios.post("http://" + window.location.hostname + ":8080/getTimeForMove", {
        code: gameCode
      });
      const endTime = Date.now() + timeForMove.data.time * 1000;
      setTimerEndTime(endTime);
    };

    // every turn: players, current turn seat, current bet
    const fetchDataOnTurn = async () => {
      // get new list of players with updated balances and other things
      let res = await axios.post("http://" + window.location.hostname + ":8080/getListOfPlayers", {
        code: gameCode
      });
      const players = res.data.players;
      console.log(players);
      setPlayers(players);

      // current turn seat
      res = await axios.post("http://" + window.location.hostname + ":8080/getCurrentTurnSeat", {
        code: gameCode
      });
      setCurrentTurnSeat(res.data.seat);

      // current bet
      res = await axios.post("http://" + window.location.hostname + ":8080/getCurrentBet", {
        code: gameCode
      });
      setCurrentBet(res.data.currentBet);
    };

    // every round: players, current turn seat, current bet, cards on table
    const fetchDataOnRound = async () => {
      // get new list of players with updated balances and other things
      let res = await axios.post("http://" + window.location.hostname + ":8080/getListOfPlayers", {
        code: gameCode
      });
      const players = res.data.players;
      console.log(players);
      setPlayers(players);

      // current turn seat
      res = await axios.post("http://" + window.location.hostname + ":8080/getCurrentTurnSeat", {
        code: gameCode
      });
      setCurrentTurnSeat(res.data.seat);

      // current bet
      res = await axios.post("http://" + window.location.hostname + ":8080/getCurrentBet", {
        code: gameCode
      });
      setCurrentBet(res.data.currentBet);      
      
      // cards on table
      res = await axios.post("http://" + window.location.hostname + ":8080/getCardsOnTable", {
        code: gameCode
      });
      setCurrentBet(res.data.currentBet);
    };

    fetchDataOnStart();

    socket.on("next_turn", (data) => {
      console.log("Received next turn update", data.endTime);
      fetchDataOnTurn();
      setTimerEndTime(data.endTime);
    });

    socket.on("next_round", (data) => {
      console.log("Receiverd next round update", data.endTime);
      fetchDataOnRound();
      setTimerEndTime(data.endTime);
    })

    fetchDataOnStart();
    // now get all the data

    return () => {
      socket.off("next_turn");
      socket.off("next_round");
      socket.off("game_started");
    };
  }, []);

  const handleMove = () => {
    socket.emit("move", {
      action: "raise",
      raiseValue: 5,
      playerId: myId,
      gameCode: gameCode
    });
  }

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