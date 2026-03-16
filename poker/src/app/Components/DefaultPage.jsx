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
        <div className="flex justify-center items-center max-w-full h-full max-h-2/3"></div>
        <div className="flex justify-center items-center max-w-full h-full max-h-1/3 gap-5.5">
          <button className="bg-red-700 join-btn p-5 w-100 h-22 rounded-xl border-4 border-solid border-black duration-700 ease-in-out">
            <p className=" text-white font-semibold text-2xl font-mono cursor-pointer">Dołącz do gry</p>
          </button>
          <button className="bg-black p-5 w-100 h-22 rounded-xl border-4 border-solid border-rose-700">
            <p className="text-white font-semibold text-2xl font-mono cursor-pointer  ">Stwórz grę</p>
          </button>
        </div>
    </div>
  );
}