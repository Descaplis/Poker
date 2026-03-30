import Player from "./Player";

export default async function Lobby() {
    return (
        <div className="max-w-full h-240 bg-gray-800">
            <div className="grid columns-3 grid-flow-col">
                <div className=""></div>
                <div className="">
                    <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-30% to-amber-300 to-70% text-5xl font-black text-center p-5">Pokój</h1>
                    <h2 className="font-black text-center text-3xl text-white">Kod:</h2>
                    <div className="flex items-center max-w-full h-full max-h-9/10 gap-5.5 flex-col pt-5">
                        <div className="flex flex-col w-240 h-164 border-3 rounded-s-4xl border-white p-5 gap-2 overflow-y-auto overflow-x-hidden">
                            {/* Miejsce na graczy */}
                        </div>
                        <div>
                            <button type="button" className="bg-gradient-to-r from-rose-500 via-red-700 to-red-800 
                                hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-500 dark:focus:ring-red-800 
                                shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                                w-100 p-4 m-3 border-4 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Wyjdź</button>
                            <button type="button" className="text-gray-200 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 
                                hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-700 dark:focus:ring-red-800 
                                shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                                w-100 p-4 m-3 border-3 border-red-800 self-start rounded-xl text-5xl font-black cursor-pointer">Start</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center">
                    {/* <h2 className="font-black text-white text-2xl m-5">Czas na ruch:</h2>
                    <h2 className="font-black text-white text-2xl m-5">Small blind:</h2>
                    <h2 className="font-black text-white text-2xl m-5">Poczatkowa stawka:</h2> */}
                </div>
            </div>
        </div>
    );
}