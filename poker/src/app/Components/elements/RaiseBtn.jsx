export default function RaiseBtn(){
    const popUp = () => {
        var czyWysw = false;
    }

    return (
        <div className="h-200 flex justify-center items-end">
            <button className="w-1/9 h-[8vh] bg-radial-[at_20%_25%] from-amber-500 via-orange-400 via-45% to-yellow-300 to-90% rounded-2xl cursor-pointer"
                onClick={popUp()}>
                <p className="bg-clip-text text-transparent bg-linear-to-r from-red-800 from-30% to-amber-950 to-70% text-3xl font-black">Podbij</p>
            </button>
        </div>

    );
}