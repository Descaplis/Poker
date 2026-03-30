import { Server } from "socket.io";
import { pool, createGame, joinGame, startGame, Raise, Fold, Check, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable } from './db.mjs';

const createWebsocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000"]
        }
    });

    io.on("connection", (socket) => {
        socket.emit("Hello", "Hello from the server!");

        socket.on("message", (msg) => {
            console.log("Received message:", msg);
        });

        socket.on("test", (code, username) => {
            createGame(code, username);
        });
    });

    
}


export default createWebsocketServer;