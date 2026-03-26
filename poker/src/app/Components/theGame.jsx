import Player from "./Player";

export default function theGame(){
    return (
        <div className="max-w-full w-full max-h-240 h-240 bg-radial-[at_50%_55%] from-sky-200 via-blue-400 to-indigo-900 to-90%">
            <div className="flex flex-row">
                <div className="flex flex-col items-center justify-evenly w-110 h-240">
                    <Player name="8"/>
                    <Player name="7"/>
                </div>
                <div className="w-7xl h-240">
                    <div className="h-50 flex justify-evenly p-7">
                        <Player name="Gracz 1"/>
                        <Player name="Gracz 2"/>
                    </div>
                    <div className="flex justify-center h-140">
                        <div className="w-6xl h-140 bg-radial-[at_35%_35%] from-gray-500 to-black to-75% rounded-4xl p-5">
                            <div className="w-278 h-130 bg-radial-[at_35%_35%] from-green-600 to-green-800 to-75% rounded-4xl">
                                {/* Miejsce na karty */}
                            </div>
                        </div>
                    </div>
                    <div className="h-50 flex justify-evenly p-7">
                        <Player name="Gracz 6"/>
                        <Player name="Gracz 5"/>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-evenly w-110 h-240">
                    <Player name="3"/>
                    <Player name="4"/>
                </div>
            </div>
        </div>
    );
}