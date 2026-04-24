'use client'
import { useRef, useEffect } from "react";

export default function AllInBtn({show}){
    if(!show) return;

    const modal = useRef();

    const popUp = () => {
        modal.current.style.display = "block";
    }

    const closePop = () => {
        modal.current.style.display = "none";
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modal.current && event.target === modal.current) {
                closePop();
            }
        }
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="">
            <button className="w-[10vw] h-[8vh] bg-radial-[at_20%_25%] from-amber-500 via-orange-400 via-45% to-yellow-300 to-90% rounded-2xl cursor-pointer
            border-2 border-amber-900" onClick={popUp}>
                <p className="bg-clip-text text-transparent bg-linear-to-r from-red-800 to-black text-3xl font-black">All In</p>
            </button>
            <div className="fixed z-1 left-0 top-0 w-screen h-screen bg-black/40" ref={modal} style={{display: 'none'}}>
                <div className="relative flex flex-col bg-radial-[at_20%_25%] from-slate-950 to-indigo-950
                    m-auto p-[1%] border border-black w-[20vw] shadow-xl/30 rounded-b-2xl animate-popup">
                    <label className="font-black text-white text-lg">Czy na pewno?</label>
                    <div className="flex flex-row gap-2">
                        <button className="mx-auto mt-4 bg-green-700 p-2 w-[10vw] text-white font-bold rounded-xl border-2 border-black cursor-pointer">Potwierdź</button>
                        <button className="mx-auto mt-4 bg-red-700 p-2 w-[10vw] text-white font-bold rounded-xl border-2 border-black cursor-pointer">Anuluj</button>
                    </div>
                </div>
            </div>
        </div>

    );
}