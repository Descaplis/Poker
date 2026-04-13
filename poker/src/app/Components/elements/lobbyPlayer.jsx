export default function LobbyPlayer({ name }){
    return (
        <div className="w-230 h-40 bg-radial-[at_35%_35%] from-gray-700 to-gray-900 to-75% rounded-2xl border-4 border-red-700 p-5">
            <h1 className="text-white text-4xl font-black text-center m-auto">{name}</h1>
        </div>
    );
}