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
    <div className="max-w-full h-239 bg-gray-800">
        <div className="flex justify-center items-center max-w-full h-full max-h-2/3">
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-red-900 from-20% to-amber-300 to-80% text-5xl font-black">TITLE HERE</h1>
        </div>
        <div className="flex justify-center items-center max-w-full h-full max-h-1/3 gap-5.5">
          <button type="button" className="bg-gradient-to-r from-rose-500 via-red-700 to-red-800 
                  hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-500 dark:focus:ring-red-800 
                  shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                  w-100 p-4 m-5 border-4 border-black self-start rounded-xl text-5xl font-black cursor-pointer">Dołącz</button>
            <button type="button" className="text-gray-200 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 
                  hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-400 dark:focus:ring-green-800 
                  shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 rounded-base text-center
                  w-100 p-5 m-5 border-3 border-red-800 self-start rounded-xl text-4xl font-black cursor-pointer">Stwórz pokój</button>
        </div>
    </div>
  );
}