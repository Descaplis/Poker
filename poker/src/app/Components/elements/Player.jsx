export default function Player({ name, position, cards }) {
    return (
        <div>
            {position == 'down' ? (
                    <div className="w-75 h-35 bg-radial-[at_35%_35%] from-gray-700 to-gray-900 to-75% rounded-full border-4 relative border-red-700 p-2">
                        <div className="flex justify-center absolute -top-25 left-0 right-0">
                            <div className="w-20 h-27 bg-amber-600 transform-cpu rotate-348"></div>
                            <div className="w-20 h-27 bg-amber-600 transform-cpu rotate-12"></div>
                        </div>
                        <h1 className="text-white text-2xl font-black text-center m-auto pointer-events-none">{name}</h1>
                        <h1 className="text-white text-lg font-black text-center pointer-events-none">Stan: $1000</h1>
                        <h1 className="text-white text-xl font-black text-center mt-1 pointer-events-none">30s</h1>
                    </div>
                ) :                 
                <div className="w-75 h-35 bg-radial-[at_35%_35%] from-gray-700 to-gray-900 to-75% rounded-full border-4 border-red-700 p-2">
                    <h1 className="text-white text-2xl font-black text-center m-auto pointer-events-none">{name}</h1>
                    <h1 className="text-white text-lg font-black text-center pointer-events-none">Stan: $1000</h1>
                    <h1 className="text-white text-xl font-black text-center mt-1 pointer-events-none">30s</h1>
                    <div className="flex relative justify-center">
                        <div className="w-20 h-27 bg-amber-600 transform-cpu rotate-348"></div>
                        <div className="w-20 h-27 bg-amber-600 transform-cpu rotate-12"></div>
                    </div>
                </div>
            }
        </div>
    );
}