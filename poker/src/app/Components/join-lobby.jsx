'use client'

import React from "react";
import Link from "next/link";

export default function JoinLobby(){

    return (
        <div className="animate-bg max-w-full h-239 bg-radial-[at_50%_55%] from-gray-950 via-gray-950 to-gray-900 to-90%">
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-5">Dołącz do lobby</h1>
            <form id="join-form" className="p-5 flex flex-col items-center">
                <label className="text-2xl p-2">Nazwa gracza:</label>
                <input type="text" className="w-100 bg-amber-50 p-2 rounded-xl text-black" name="nickname"></input>
                <label className="text-2xl p-2 mt-10">Kod pokoju:</label>
                <input type="text" className="w-100 bg-amber-50 p-2 rounded-xl text-black" name="roomCode"></input>
                <div className="flex flex-row mt-20">
                    <button type="submit" className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600
                        hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-amber-300 dark:focus:ring-amber-700
                        shadow-lg shadow-amber-500/50 dark:shadow-lg dark:shadow-amber-800/80 rounded-base text-center
                        w-100 p-4 m-5 border-3 border-black self-end-safe rounded-xl text-5xl font-black cursor-pointer">Dołącz</button>
                    <Link href="/">
                        <button type="button" className="bg-gradient-to-r from-green-400 via-green-500 to-green-600
                            hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-700 
                            shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 rounded-base text-center
                            w-100 p-4 m-5 border-3 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Wróć</button>
                    </Link>
                </div>
            </form>
        </div>
    )
}