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
        <div className={`bg-red-500 mt-8 p-4 min-w-1/4 max-w-1/3 rounded-lg shadow-xl transition-all duration-1000 ease-in-out z-50 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-white text-2xl font-bold text-center">Error</h1>
            <div className="flex justify-between items-center mt-2">
                <h1 className="w-1/12 text-white text-5xl font-bold text-center">!</h1>
                <p className="w-10/12 text-md text-center">{text}</p>
                <h1 className="w-1/12 text-white text-5xl font-bold text-center">!</h1>
            </div>
        </div>
    );
}