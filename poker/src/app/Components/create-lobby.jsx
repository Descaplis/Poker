'use client'

import { useState, useRef, useRouter } from "react";
import axios from "axios";
import Link from "next/link";

export default function CreateLobby() {
    const [plyrCount, setPlyrCount] = useState(4);
    const [timeForMove, setTimeForMove] = useState(30);
    const [smallBlind, setSmallBlind] = useState(2);
    const [initialBalance, setInitialBalance] = useState(50);
    const [username, setUsername] = useState("");
    const plyrRange = useRef();

    const createRoom = async () => {
        const res = await axios.post("http://localhost:8080/createGame", {
        playersAmount: plyrCount,
        timeForMove: timeForMove,
        smallBlindValue: smallBlind,
        initialBalance: initialBalance,
        username: username
        });
        console.log(res.data);
    }

    return (
        <div className="animate-bg max-w-full max-h-240 bg-radial-[at_50%_50%] from-gray-900 via-gray-900 to-gray-950 to-90%">
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-5">Stwórz pokój</h1>
            <form id="create-form" className="text-center p-8 h-220">
                <label htmlFor="plyrRange" className="text-white text-2xl font-black">Liczba graczy: {plyrCount}</label>
                <div className="flex justify-center">
                    <h1 className="order-1 text-white text-xl font-black m-3">2</h1>
                    <input id="plyrRange" name="playerCount" ref={plyrRange} className="order-2 w-210 m-4 accent-green-700 cursor-grab range-lg" 
                        type="range" min={2} max={8} defaultValue={4} onChange={(e) => setPlyrCount(e.currentTarget.value)}></input>
                    <h1 className="order-3 text-white text-xl font-black m-3">8</h1>
                </div>
                <div className="grid columns-2 grid-flow-col">
                    <div className="flex flex-col gap-6 p-7 items-center">
                        <label className="text-white text-xl font-black mt-16">Nazwa użytkownika:</label>
                        <input className="text-black w-120 bg-amber-50 p-2 rounded-xl border-yellow-600 border-solid border-4
                            focus:ring-4 focus:outline-none focus:ring-amber-500 dark:focus:ring-amber-800" type="text" name="nickName" onChange={(e) => setUsername(e.currentTarget.value)}/>

                        <label className="text-white text-xl font-black mt-16">Small blind:</label>
                        <input className="text-black w-120 bg-amber-50 p-2 mb-15 rounded-xl border-yellow-600 border-solid border-4
                            focus:ring-4 focus:outline-none focus:ring-amber-500 dark:focus:ring-amber-800" type="text" name="smallBlind" onChange={(e) => setSmallBlind(e.currentTarget.value)}/>

                        <button type="submit" onClick={createRoom}
                        className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600
                            hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-amber-300 dark:focus:ring-amber-800
                            shadow-lg shadow-amber-500/50 dark:shadow-lg dark:shadow-amber-800/80 rounded-base text-center
                            w-100 p-4 m-5 border-3 border-black self-end-safe rounded-xl text-5xl font-black cursor-pointer">Stwórz</button>
                    </div>
                    <div className="flex flex-col gap-6 p-7 items-center">
                        <label className="text-white text-xl font-black mt-16">Początkowy balans:</label>
                        <input className="text-black w-120 bg-amber-50 p-2 rounded-xl border-yellow-600 border-solid border-4
                            focus:ring-4 focus:outline-none focus:ring-amber-500 dark:focus:ring-amber-800" type="text" name="startValue" onChange={(e) => setInitialBalance(e.currentTarget.value)}/>
                        <label className="text-white text-xl font-black mt-16">Czas na ruch:</label>
                        <input className="w-120 bg-amber-50 p-2 mb-15 rounded-xl border-yellow-600 border-solid border-4
                            focus:ring-4 focus:outline-none focus:ring-amber-500 dark:focus:ring-amber-800" type="number" name="moveTime" onChange={(e) => setTimeForMove(e.currentTarget.value)}/>
                        <Link className="self-start" href="/">
                            <button type="button" className="bg-gradient-to-r from-green-400 via-green-500 to-green-600
                                hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 
                                shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 rounded-base text-center
                                w-100 p-4 m-5 border-3 border-black rounded-xl text-5xl font-black cursor-pointer">Wróć</button>
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}