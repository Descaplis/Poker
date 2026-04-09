export default function Player({ name }) {
    return (
        <div className="w-75 h-35 bg-radial-[at_35%_35%] from-gray-700 to-gray-900 to-75% rounded-full border-4 border-red-700 p-2">
            <h1 className="text-white text-2xl font-black text-center m-auto">{name}</h1>
            <h1 className="text-white text-lg font-black text-center">Stan: $1000</h1>
            <h1 className="text-white text-xl font-black text-center mt-1">30s</h1>
        </div>
    );
}