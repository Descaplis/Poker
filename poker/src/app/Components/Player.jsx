export default function Player({ name }) {
    return (
        <div className="w-228 h-35 bg-gray-800 rounded-full border-4 border-yellow-600 p-2">
            <h1 className="text-white text-2xl font-black text-center m-auto">{name}</h1>
            <h1 className="text-white text-lg font-black text-center">Stan: $1000</h1>
            <h1 className="text-white text-xl font-black text-center mt-1">30s</h1>
        </div>
    );
}