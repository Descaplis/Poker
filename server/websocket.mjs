import { Server } from "socket.io";
import { startGame, Raise, Fold, Check, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable, LeaveGame, GetUserById, GetGameById, GetTimeForMove } from './db.mjs';

const createWebsocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000", "http://192.168.88.14:3000"],
        }
    });
    const disconnectTimeouts = {};
    const userSessionStore = new Map();

    io.on("connection", (socket) => {
        const joinRoom = (code) => {
            socket.join(code);
            console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} joined the room ${code}`);
            io.to(code).emit("refresh_list");
        }

        const nextTurn = async (playerId) => {
            const userData = userSessionStore.get(playerId);
            console.log(userData);
            if (userData) {
                socket.join(userData.code);
                console.log("found socket userdata");
                const timeForMove = await GetTimeForMove(userData.gameId);
                const endTime = Date.now() + timeForMove * 1000;
                console.log(`Emitting timer update to room ${userData.code} with end time ${endTime}`);
                io.to(userData.code).emit("timer_update", {endTime: endTime});
            } else {
                console.log("cant find socket userdata");
            }
        }

        socket.on("auth", async (playerId) => {
            console.log(`Received auth event for playerId: ${playerId}`);
            if (disconnectTimeouts[playerId]) {
                console.log(`Player ${playerId} reconnected within the timeout period. Clearing disconnect timeout.`);
                clearTimeout(disconnectTimeouts[playerId]);
                delete disconnectTimeouts[playerId];
            }

            const user = await GetUserById(playerId);
            console.log("User found: ", user);

            if (user) {
                const game = await GetGameById(user.game_id);
                console.log("Game found:", game);
                // Assigning user data to the socket to use it later
                socket.userData = {
                    playerId: user.id,
                    username: user.username,
                    code: game.code,
                    gameId: game.id,
                    isHost: user.ishost
                };
                userSessionStore.set(user.id, socket.userData);
                console.log("User session stored: ", userSessionStore);
                joinRoom(game.code);
            }
        });

        socket.on("leave_room", async (playerId, code) => {
            await LeaveGame(playerId);
            io.to(code).emit("refresh_list");
        });

        socket.on("start_game", async (code) => {
            await startGame(code);
            io.to(code).emit("game_started");
        });

        socket.on("move", async (moveData) => {
            // moveData: action, gameCode, playerId
            let res;
            switch (moveData.action) {
                case "raise":
                    res = await Raise(moveData.gameCode, moveData.playerId, moveData.raiseValue);
                    console.log(res);
                    break;
                case "check":
                    res = await Check(moveData.gameCode, moveData.playerId);
                    console.log(res);
                    break;
                case "fold":
                    res = await Fold(moveData.gameCode, moveData.playerId);
                    console.log(res);
                    break;
            }
            nextTurn(moveData.playerId);
        });

        socket.on("disconnect", async () => {
            console.log("A user disconnected");
            if (socket.userData) {
                console.log("User data found on disconnect:", socket.userData);
                console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} has disconnected from the websocket. Waiting 5 seconds before removing from the game...`);

                disconnectTimeouts[socket.userData.playerId] = setTimeout(async () => {
                    try {
                        const {playerId, code} = socket.userData;
                        await LeaveGame(playerId);
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