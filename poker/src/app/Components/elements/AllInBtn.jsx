export default function AllInBtn({show}){
    if(!show) return;
    return (
        <div className="">
            <button className="w-[10vw] h-[8vh] bg-radial-[at_20%_25%] from-orange-700 via-orange-600 via-50% to-orange-400 to-90% rounded-2xl cursor-pointer
            border-2 border-amber-900">
                <p className="text-black text-3xl font-black">ALL IN</p>
            </button>
        </div>

    );
}