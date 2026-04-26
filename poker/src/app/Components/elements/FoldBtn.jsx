export default function FoldBtn({show, onClick}){
    if(!show) return;
    return (
        <div className="">
            <button className="w-[10vw] h-[8vh] bg-radial-[at_20%_25%] from-red-700 via-red-600 via-50% to-rose-600 to-90% rounded-2xl cursor-pointer
            border-2 border-amber-900" onClick={onClick}>
                <p className="text-black text-3xl font-black">Pass</p>
            </button>
        </div>

    );
}