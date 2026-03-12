import Image from "next/image";
// import db from "../../server/db";

// async function getPersons() {
//   try {
//     const result = await db.query("SELECT * FROM persons");
//     return result.rows;
//   } catch (error) {
//     console.error("Error fetching persons:", error);
//     return [];
//   }
// }

/* {people.map((person) => (
          <li key={person.PersonID}>{person.FirstName} {person.LastName} from  {person.Address}, {person.City}</li>
))} */

export default async function MainPage() {
  // const people = await getPersons();

  return (
    <div>
        <h1 className="">People</h1>
        
        <div className="flex justify-center items-center max-w-full h-full max-h-2/3"></div>
        <div className="flex justify-center items-center max-w-full h-full max-h-1/3 gap-5.5">
          <button className="bg-gradient-to-r from-red-700 from-0% via-red-600 via-50% to-red-300 to-100% 
            p-5 w-100 h-22 rounded-xl border-4 border-solid border-black 
            hover:bg-gradient-to-l from-red-700 from-0% via-red-600 via-50% to-red-300 to-100% duration-500 ease-in-out">
            <p className=" text-white font-semibold text-2xl font-mono">Dołącz do gry</p>
          </button>
          <button className="bg-gradient-to-r from-black from-0% via-slate-900 via-70% to-slate-600 to-100% p-5 w-100 h-22 rounded-xl border-4 border-solid border-rose-700">
            <p className="text-white font-semibold text-2xl font-mono">Stwórz grę</p>
          </button>
        </div>
    </div>
  );
}