'use client'

import { useState, useRef } from "react";

export default function CreateLobby() {
    const [plyrCount, setPlyrCount] = useState(4);
    const plyrRange = useRef();

    return (
        <div className="max-w-full h-239 bg-gray-800">
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-3">Stwórz pokój</h1>
            <form id="create-form">
                <div className="columns-3 gap-8 text-center">
                    <div className="aspect-1/3"></div>
                    <div className="aspect-1/3 flex flex-col">
                        <label className="text-white text-xl font-black m-4">Liczba graczy: {plyrCount}</label>
                        <div className="flex justify-between">
                            <h1 className="order-1 text-white text-xl font-black m-3">2</h1>
                            <input id="plyrRange" ref={plyrRange} className="order-2 w-full m-3 accent-green-700" 
                                type="range" min={2} max={8} defaultValue={4} onChange={(e) => setPlyrCount(e.currentTarget.value)}></input>
                            <h1 className="order-3 text-white text-xl font-black m-3">8</h1>
                        </div>
                        <label className="text-white text-xl font-black mt-16">Nazwa użytkownika:</label>
                        <input className="bg-amber-50 p-2 m-5 rounded-xl border-yellow-600 border-solid border-4" type="text"></input>
                    </div>
                    <div className="aspect-1/3"></div>
                </div>
            </form>
        </div>
    );
}