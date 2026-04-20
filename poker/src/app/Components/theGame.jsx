'use client'
import Player from "./elements/Player";
import { useState, useEffect } from "react";

export default function theGame() {

return (
  <div className="min-h-screen w-full bg-radial-[at_50%_55%] from-gray-400 from-20% via-gray-600 via-55% to-gray-900 flex items-center justify-center p-4">
    {/* Główny kontener gry */}
    <div className="relative w-10/11 flex items-center justify-center">
      {/* Gracze po lewej (8 i 7) */}
      <div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
        <Player name="Gracz 8" position="left" balance={0} isAllIn={true}/>
        <Player name="Gracz 7" position="left" balance={0} isAllIn={false}/>
      </div>

        {/* Środek: Góra, Stół, Dół */}
        <div className="flex-1 flex flex-col items-center">
            {/* Gracze na górze (1 i 2) */}
            <div className="flex justify-evenly w-full max-w-2xl gap-4">
              <Player name="Gracz 1" balance={100} isAllIn={false}/>
              <Player name="Gracz 2" blind="small"/>
            </div>

            {/* STÓŁ */}
            <div className="w-full aspect-2/1 grow flex items-center justify-center p-2 md:p-4 mt-[4vh]">
                <div className="aspect-2/1 w-full border-amber-900 border-4 lg:border-6 bg-radial-[at_35%_35%] from-gray-500 to-black rounded-[50px] lg:rounded-[80px] p-3 lg:p-6 shadow-2xl">
                    <div className="flex justify-center items-center w-full h-full bg-radial-[at_35%_35%] from-green-600 to-green-950 rounded-[40px] gap-3">
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

            {/* Gracze na dole (5 i 6) */}
            <div className="flex justify-evenly w-full max-w-2xl gap-4">
                <Player name="Gracz 6" position="down" cards={["3Pik", "queenKier"]} balance={10} isAllIn={false}/>
                <Player name="Gracz 5" position="down" balance={48} isFolded={true}/>
            </div>
      </div>

      {/* Gracze po prawej (3 i 4) */}
      <div className="flex flex-col justify-around gap-[10vh] h-[60vh] md:h-[50vh]">
        <Player name="Gracz 3" position="right" blind="big"/>
        <Player name="Gracz 4" position="right"/>
      </div>
    </div>
  </div>
);
}