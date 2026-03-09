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
        
    </div>
  );
}