import Image from "next/image";
import MainPage from "./Components/DefaultPage";
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

export default async function Home() {
  // const people = await getPersons();

  return (
    <div className="w-full h-100">
      <MainPage/>
      <ol>
        {/* {people.map((person) => (
          <li key={person.PersonID}>{person.FirstName} {person.LastName} from  {person.Address}, {person.City}</li>
        ))} */}
      </ol>
    </div>
  );
}
