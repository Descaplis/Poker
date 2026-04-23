'use client'
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MainPage() {

  const router = useRouter();

  return (
    <div className="animate-bg max-w-full h-239 bg-radial-[at_50%_55%] from-gray-950 via-gray-900 to-gray-800 to-90%">
        <div className="flex justify-center items-center max-w-full h-full max-h-2/3">
          <img src="/images/title.png" alt="Title" className="animate-title"/>
        </div>

        <div className="flex justify-center items-center max-w-full h-full max-h-1/3 gap-5.5">
          <Link href="/join-lobby">
            <button type="button" className="bg-linear-to-r from-rose-500 via-red-700 to-red-800 
              hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-red-500 dark:focus:ring-red-800 
              shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
              w-100 p-4 m-5 border-4 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Dołącz</button>
          </Link>
          <Link href="/create-lobby">
            <button type="button" className="text-gray-200 bg-linear-to-r from-gray-700 via-gray-800 to-gray-900 
              hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-red-700 dark:focus:ring-red-800 
              shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
              w-100 p-5 m-5 border-3 border-red-800 self-start rounded-xl text-4xl font-black cursor-pointer">Stwórz pokój</button>
          </Link>
        </div>
    </div>
  );
}