import { useState, useEffect } from "react";

export default function Error({ text, onRemove }) {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const animationTimeout = setTimeout(() => setIsLeaving(true), 4000);
         const removeTimeout = setTimeout(onRemove, 5000);

        return () => {
            clearTimeout(animationTimeout);
            clearTimeout(removeTimeout);
        };
    }, []);

    return (
        <div class={`backdrop-blur-md bg-red-500/50 border border-white/20 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center
            transition-all duration-1000 ease-in-out z-50 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-red-600 text-4xl font-bold mb-2 text-shadow-lg text-shadow-red-300/50">No i co ty robisz?</h1>
            <p className="text-black font-bold text-sm mt-2">{text}</p>
        </div>
    );
}