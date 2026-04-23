import Image from "next/image";
import Timer from "./timer";

export default function Player({ name, position, cards, balance, bet, endTime, isAllIn, blind, isFolded, isCurrentTurn }) {
    return (
        <div>
            <div className={`w-[16vw] h-[15vh] 
                ${isAllIn ? 'bg-radial-[at_50%_35%] from-amber-400 via-amber-600 to-amber-700 to-75%' : 
                'bg-radial-[at_35%_35%] from-gray-700 to-gray-900 to-75%'} rounded-full border-4 relative 
                ${isFolded ? 'border-black' : 'border-red-700'}
                p-2
                ${balance == 0 && !isAllIn && 'opacity-50'}
                ${isCurrentTurn ? "shadow-[0_0_20px_4px_rgba(96,165,250,0.6)]" : ""}
                transition-all duration-300`}
            >
                {/* Cards */}
                <div className={`flex justify-center absolute 
                    ${position == 'down' ? '-top-25 left-0 right-0' :
                    position == 'left' ? 'top-0 left-0 -right-85' :
                    position == 'right' ? 'top-0 -left-85 right-0' : 
                    'top-25 left-0 right-0'}`}
                >
                    <div className="w-[4.3vw] h-[12vh] transform-cpu rotate-348">
                        {
                            cards ? 
                            <Image src={`/images/karty/${cards[0]}.png`} fill alt="card1"/>
                            :
                            <Image src="/images/karty/BackCard.png" fill alt="card1"/>
                        }
                    </div>

                    <div className="w-[4.3vw] h-[12vh] transform-cpu rotate-12">
                        {
                            cards ? 
                            <Image src={`/images/karty/${cards[1]}.png`} fill alt="card2"/>
                            :
                            <Image src="/images/karty/BackCard.png" fill alt="card2"/>
                        }
                    </div>
                </div>

                {/* Player data */}
                <div className={`${position != 'down' || position != 'right' || position != 'left' ? '' : 'relative top-25 left-0 right-0'}`}>
                    <h1 className={`${isFolded ? 'text-gray-600' : 'text-white'} text-2xl font-black text-center m-auto pointer-events-none`}>{name}</h1>

                    <h1 className={`${isFolded ? 'text-gray-600' : 'text-white'} text-lg font-black text-center pointer-events-none`}>Stan: ${balance}</h1>

                    {bet > 0 && (
                    <h1 className={`${isFolded ? 'text-gray-600' : 'text-yellow-300'} text-lg font-bold text-center pointer-events-none`}>
                    zakład: ${bet}
                    </h1>
                    )}

                    {isCurrentTurn && endTime ? (
                        <Timer endTime={endTime} isFolded={isFolded}/>
                    )
                    : (
                        <div></div>
                    )}

                    <div className={`${position == 'right' && 'relative'}`}>
                        {
                            blind == 'small' ? (
                                <div className="w-[2vw] h-[3.9vh] bg-black rounded-full flex justify-center items-center-safe border-amber-50 border-2">
                                    <h2 className="text-white font-black">S</h2>
                                </div>
                            ) : blind == 'big' ? (
                                <div className="w-[2vw] h-[3.9vh] bg-black rounded-full flex justify-center items-center-safe border-amber-50 border-2">
                                    <h2 className="text-white font-black cursor-default">B</h2>
                                </div>
                            ) :
                            <div></div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}