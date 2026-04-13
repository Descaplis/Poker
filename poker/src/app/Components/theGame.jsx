'use client'
import Player from "./elements/Player";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://" + window.location.hostname + ":8080");

export default function theGame() {

return (
  <div className="min-h-screen w-full bg-radial-[at_50%_55%] from-sky-200 via-blue-400 to-indigo-900 flex items-center justify-center p-4">
    {/* Główny kontener gry */}
    <div className="relative w-11/12 flex items-center justify-center">
      {/* Gracze po lewej (8 i 7) */}
      <div className="flex flex-col justify-around h-[60vh] md:h-[50vh]">
        <Player name="Gracz 8" />
        <Player name="Gracz 7" />
      </div>

        {/* Środek: Góra, Stół, Dół */}
        <div className="flex-1 flex flex-col items-center gap-8">
            {/* Gracze na górze (1 i 2) */}
            <div className="flex justify-evenly w-full max-w-2xl gap-4">
                <Player name="Gracz 1" />
                <Player name="Gracz 2" />
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
                <Player name="Gracz 6" />
                <Player name="Gracz 5" />
            </div>
      </div>

      {/* Gracze po prawej (3 i 4) */}
      <div className="flex flex-col justify-around h-[60vh] md:h-[50vh]">
        <Player name="Gracz 3" />
        <Player name="Gracz 4" />
      </div>
    </div>
  </div>
);
}