import { Server } from "socket.io";
import { CreateGame, JoinGame, startGame, Raise, Fold, Check, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable, LeaveGame, GetUserById, GetGameById } from './db.mjs';

const createWebsocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000"]
        }
    });
    const disconnectTimeouts = {};

    io.on("connection", (socket) => {
        const joinRoom = (code) => {
            socket.join(code);
            console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} joined the room ${code}`);
            io.to(code).emit("refresh_list");
        }

        socket.on("auth", async (playerId) => {
            if (disconnectTimeouts[playerId]) {
                console.log(`Player ${playerId} reconnected within the timeout period. Clearing disconnect timeout.`);
                clearTimeout(disconnectTimeouts[playerId]);
                delete disconnectTimeouts[playerId];
            }

            const user = await GetUserById(playerId);

            if (user) {
                const game = await GetGameById(user.game_id);
                console.log(`Player ${user.username} with id ${user.id} has connected to the websocket`);
                // Assigning user data to the socket to use it later
                socket.userData = {
                    playerId: user.id,
                    username: user.username,
                    code: game.code,
                    isHost: user.ishost
                };
                socket.join(user.game_id);
                joinRoom(game.code);
            }
        });

        socket.on("leave_room", async (playerId) => {
            if (socket.userData) {
                const {playerId, code} = socket.userData;
                const res = await LeaveGame(playerId);
                io.to(code).emit("refresh_list");
            }
        });

        socket.on("disconnect", async () => {
            console.log("A user disconnected");
            if (socket.userData) {
                console.log("User data found on disconnect:", socket.userData);
                console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} has disconnected from the websocket. Waiting 5 seconds before removing from the game...`);

                disconnectTimeouts[socket.userData.playerId] = setTimeout(async () => {
                    try {
                        const {playerId, code} = socket.userData;
                        const res = await LeaveGame(playerId);
                        io.to(code).emit("refresh_list");
                        delete disconnectTimeouts[playerId];
                    } catch (err) {
                        console.error("An error occured during deleting player: ", err);
                    }
                }, 5000);
            }
        });
    });

    
}


export default createWebsocketServer;