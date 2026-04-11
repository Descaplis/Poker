"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LobbyPlayer from "./elements/lobbyPlayer";
import axios from "axios";

export default function Lobby() {
    const [players, setPlayers] = useState([]);
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const isHost = searchParams.get("isHost");

    useEffect(() => {
        const fetchPlayers = async () => {
            if (!code) return;
            console.log(code);
            const res = await axios.post("http://localhost:8080/getListOfPlayers", {
                code: code
            });
            setPlayers(res.data.players);
        };

        fetchPlayers();
        console.log(isHost); // -> null, but why?
    }, [code]);

    return (
        <div className="max-w-full h-240 bg-gray-800">
            <div className="grid columns-3 grid-flow-col">
                <div className=""></div>
                <div className="">
                    <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-5">Pokój</h1>
                    <h2 className="font-black text-center text-3xl text-white">Kod: {code}</h2>
                    <div className="flex items-center max-w-full h-full max-h-9/10 gap-5.5 flex-col pt-5">
                        <div className="flex flex-col w-240 h-164 border-3 rounded-s-4xl border-white p-5 gap-5 overflow-y-auto overflow-x-hidden">
                            {players?.map((player, index) => (
                                <LobbyPlayer key={index} name={player.username}/>
                            ))}
                        </div>
                        <div>
                            <button type="button" className="bg-gradient-to-r from-rose-500 via-red-700 to-red-800 
                                hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-500 dark:focus:ring-red-800 
                                shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                                w-100 p-4 m-3 border-4 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Wyjdź</button>
                                {isHost == 'true' ? (
                                    <button type="button" className="text-gray-200 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 
                                        hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-700 dark:focus:ring-red-800 
                                        shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                                        w-100 p-4 m-3 border-3 border-red-800 self-start rounded-xl text-5xl font-black cursor-pointer">Start</button>
                                ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center"></div>
            </div>
        </div>
    );
}