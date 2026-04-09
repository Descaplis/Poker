import Image from "next/image";
import MainPage from "./Components/DefaultPage";
import CreateLobby from "./Components/create-lobby";
import Player from "./Components/elements/Player";
import Lobby from "./Components/lobby";
import TheGame from "./Components/theGame";
import JoinLobby from "./Components/join-lobby";

export default async function Home() {
  return (
    <div className="max-w-full max-h-full">
      <Lobby/>
    </div>
  );
}
