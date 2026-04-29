'use client'

import Error from "./elements/error";
import { useState, useRef} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function CreateLobby() {
    const [plyrCount, setPlyrCount] = useState(4);
    const [timeForMove, setTimeForMove] = useState("");
    const [smallBlind, setSmallBlind] = useState("");
    const [initialBalance, setInitialBalance] = useState("");
    const [username, setUsername] = useState("");
    const plyrRange = useRef();
    const [errors, setErrors] = useState([]);
    const router = useRouter();

    const createRoom = async () => {
        if (username.trim() === "") {
            showAlert("Nazwa użytkownika nie może być pusta!");
            return;
        }
        if (smallBlind.includes("e") || Number(smallBlind) <= 0) {
            showAlert("Nieprawidłowa wartość small blinda!");
            return;
        }
        if (initialBalance.includes("e") || Number(initialBalance) <= 0) {
            showAlert("Nieprawidłowa wartość początkowego balansu!");
            return;
        }
        if (timeForMove.includes("e") || Number(timeForMove) <= 0) {
            showAlert("Nieprawidłowa wartość czasu na ruch!");
            return;
        }
        if (plyrCount < 2 || plyrCount > 8) {
            showAlert("Liczba graczy musi być pomiędzy 2 a 8!");
            return;
        }

        try {
            const res = await axios.post("http://localhost:8080/createGame", {
                playersAmount: plyrCount,
                timeForMove: timeForMove,
                smallBlindValue: smallBlind,
                initialBalance: initialBalance,
                username: username
            });
            console.log(res.data.game);
            sessionStorage.setItem("playerId", res.data.game.playerId);
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("code", res.data.game.code);
            sessionStorage.setItem("isHost", true);
            router.push(`/lobby`);
        } catch (error) {
            alert(error);
            showAlert("Wystąpił błąd serwera!");
        }
    }

    function showAlert(text) {
        const id = Date.now() + Math.random(); // Math.random() to ensure uniqueness even if two errors occur at the same millisecond
        setErrors(prevErrors => [...prevErrors, { id: id, text: text }]);
    }

    return (
        <>
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z[100 flex flex-col items-center gap-3 w-full">
                {errors.map((error) => (
                    <Error 
                        key={error.id} 
                        text={error.text} 
                        onRemove={() => setErrors(prevErrors => prevErrors.filter(e => e.id !== error.id))} 
                    />
                ))}
            </div>

            <div className="animate-bg max-w-full max-h-screen h-screen bg-radial-[at_50%_50%] from-gray-900 via-gray-900 to-gray-950 to-90%">
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
                                focus:ring-4 focus:shadow-2xl focus:shadow-amber-500 dark:focus:ring-amber-800" type="text" name="nickName" onChange={(e) => setUsername(e.currentTarget.value)}/>

                            <label className="text-white text-xl font-black mt-16">Small blind:</label>
                            <input className="text-black w-120 bg-amber-50 p-2 mb-15 rounded-xl border-yellow-600 border-solid border-4
                                focus:ring-4 focus:shadow-2xl focus:shadow-amber-500 dark:focus:ring-amber-800" type="number" name="smallBlind" onChange={(e) => setSmallBlind(e.currentTarget.value)}/>

                            <button type="button" onClick={createRoom}
                                className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600
                                hover:bg-gradient-to-br focus:ring-4 focus:shadow-2xl focus:shadow-amber-300 dark:focus:ring-amber-800
                                shadow-lg shadow-amber-500/50 dark:shadow-lg dark:shadow-amber-800/80 rounded-base text-center
                                w-100 p-4 m-5 border-3 border-black self-end-safe rounded-xl text-5xl font-black cursor-pointer">Stwórz</button>
                        </div>
                        <div className="flex flex-col gap-6 p-7 items-center">
                            <label className="text-white text-xl font-black mt-16">Początkowy balans:</label>
                            <input className="text-black w-120 bg-amber-50 p-2 rounded-xl border-yellow-600 border-solid border-4
                                focus:ring-4 focus:shadow-2xl focus:shadow-amber-500 dark:focus:ring-amber-800" type="number" name="startValue" onChange={(e) => setInitialBalance(e.currentTarget.value)}/>
                            <label className="text-white text-xl font-black mt-16">Czas na ruch:</label>
                            <input className="text-black w-120 bg-amber-50 p-2 mb-15 rounded-xl border-yellow-600 border-solid border-4
                                focus:ring-4 focus:shadow-2xl focus:shadow-amber-500 dark:focus:ring-amber-800" type="number" min={10} max={120} name="moveTime" onChange={(e) => setTimeForMove(e.currentTarget.value)}/>
                            <Link className="self-start" href="/">
                                <button type="button" className="bg-gradient-to-r from-green-400 via-green-500 to-green-600
                                    hover:bg-gradient-to-br focus:ring-4 focus:shadow-2xl focus:shadow-green-300 dark:focus:ring-green-800
                                    shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 rounded-base text-center
                                    w-100 p-4 m-5 border-3 border-black rounded-xl text-5xl font-black cursor-pointer">Wróć</button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}