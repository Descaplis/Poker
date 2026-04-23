'use client'

import {React, useState} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Error from "./elements/error";

export default function JoinLobby(){
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [errors, setErrors] = useState([]);

    function showAlert(text) {
        const id = Date.now() + Math.random(); // Math.random() to ensure uniqueness even if two errors occur at the same millisecond
        setErrors(prevErrors => [...prevErrors, { id: id, text: text }]);
    }

    const joinRoom = async () => {
        if (username === "") {
            showAlert("Nazwa użytkownika nie może być pusta!");
            return;
        }
        if (code === "") {
            showAlert("Kod pokoju nie może być pusty!");
            return;
        }
        if (code.length !== 6 || !(Number(code) > 0)) {
            showAlert("Niepoprawny kod");
            return;
        }

        try {
            const res = await axios.post("http://" + window.location.hostname + ":8080/joinGame", {
                code: code,
                username: username
            });

            if (res.data.result.success == true) {
                console.log(`Successfully ${username} with id ${res.data.result.playerId} joined the game with code ${code}`);
                sessionStorage.setItem("playerId", res.data.result.playerId);
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("code", code);
                sessionStorage.setItem("isHost", false);
                console.log("Data stored in sessionStorage, username:" + sessionStorage.getItem("username") + ", playerId: " + sessionStorage.getItem("playerId") + ", code: " + sessionStorage.getItem("code") + ", isHost: " + sessionStorage.getItem("isHost"));
                router.push("/lobby");
            } else {
                showAlert(res.data.result.message);
            }
        } catch (error) {
            showAlert("Wystąpił błąd serwera!");
        }
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

            <div className="animate-bg max-w-full h-239 bg-radial-[at_50%_55%] from-gray-950 via-gray-950 to-gray-900 to-90%">
                <h1 className="bg-clip-text text-transparent bg-linear-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-5">Dołącz do lobby</h1>
                <form id="join-form" className="p-5 flex flex-col items-center">
                    <label className="text-gray-200 font-black text-2xl p-2">Nazwa gracza:</label>
                    <input type="text" className="w-100 bg-amber-50 p-2 rounded-xl text-black" name="nickname" onChange={(e) => setUsername(e.currentTarget.value)}/>
                    <label className="text-gray-200 font-black text-2xl p-2 mt-10">Kod pokoju:</label>
                    <input type="text" className="w-100 bg-amber-50 p-2 rounded-xl text-black" name="roomCode" onChange={(e) => setCode(e.currentTarget.value)}/>
                    <div className="flex flex-row mt-20">
                        <button type="button" onClick={joinRoom} className="bg-linear-to-r from-amber-700 via-amber-500 to-amber-600
                            hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-amber-300 dark:focus:ring-amber-700
                            shadow-lg shadow-amber-500/50 dark:shadow-lg dark:shadow-amber-800/80 rounded-base text-center
                            w-100 p-4 m-5 border-3 border-black self-end-safe rounded-xl text-5xl font-black cursor-pointer">Dołącz</button>
                        
                        <button type="button" onClick={() => router.back()} className="bg-linear-to-r from-green-400 via-green-500 to-green-600
                            hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-700 
                            shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 rounded-base text-center
                            w-100 p-4 m-5 border-3 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Wróć</button>
                    </div>
                </form>
            </div>
        </> 
    )
}