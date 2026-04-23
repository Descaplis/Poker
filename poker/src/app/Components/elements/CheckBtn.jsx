export default function CheckBtn({show}){
    if(!show) return;
    return (
        <div className="">
            <button className="w-[10vw] h-[8vh] bg-radial-[at_20%_25%] from-green-700 via-green-600 via-50% to-green-400 to-90% rounded-2xl cursor-pointer
            border-2 border-green-950">
                <p className="text-black text-3xl font-black">Sprawdź</p>
            </button>
        </div>

    );
}