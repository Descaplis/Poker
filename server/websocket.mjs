import { Server } from "socket.io";
import { startGame, Raise, Fold, Check, GetMaximumRaiseValue, GetListOfPlayers, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable, LeaveGame, GetUserById, GetGameById, GetTimeForMove, SetTurnEndTime, GetGameStatus } from './db.mjs';
import { allowedOrigins } from "./index.mjs";

const createWebsocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
        }
    });
    const disconnectTimeouts = {};
    const userSessionStore = new Map();
    const autoCheckTimeouts = {};

    const nextTurn = async (code) => {
        console.log("executing nextTurn for", code)
        const timeForMove = await GetTimeForMove(code);
        const endTime = Date.now() + timeForMove * 1000;

        if (autoCheckTimeouts[code]) {
            clearTimeout(autoCheckTimeouts[code]);
        }

        SetTurnEndTime(code, endTime);
        console.log(`Emitting timer update to room ${code} with end time ${endTime}`);
        io.to(code).emit("next_turn", {endTime});

        const seatAtStart = await GetCurrentTurnSeat(code);

        autoCheckTimeouts[code] = setTimeout(async () => {
            const currentSeat = await GetCurrentTurnSeat(code);
            if (currentSeat == seatAtStart) {
                const players = await GetListOfPlayers(code);
                const currentPlayer = players.find(p => p.seat == currentSeat);
                if (currentPlayer) {
                    try {
                        await Fold(code, currentPlayer.id);
                        nextTurn(code);
                    } catch (e) {
                        console.error("Auto-fold failed", e);
                    }
                }
            }
        }, timeForMove * 1000);
    }

    const handleMoveResult = async (res, code) => {
        console.log("handleMoveResult:", JSON.stringify(res), "code:", code);
        if (!res) {
            console.log("Brak res, nextTurn");
            await nextTurn(code);
            return;
        }

        if (res.roundFinished) {
            if (res.gameOver) {
                // The whole game is over
                console.log("Koniec gry! Zwycięzcy:", res.winners);
                io.to(code).emit("game_over", {
                    winners: res.winners.map(w => ({
                        username: w.player?.username || w.username,
                        id: w.player?.id || w.id,
                        rank: w.hand?.name
                    }))
                });
            } else if (res.handOver) {
                // Hand is over, the game goes on — show hand winners, then start a new hand
                console.log("Koniec rozdania! Zwycięzcy rozdania:", res.winners);
                io.to(code).emit("hand_over", {
                    winners: res.winners.map(w => ({
                        username: w.player?.username || w.username,
                        id: w.player?.id || w.id,
                        rank: w.hand?.name
                    }))
                });
                // Wait 10 seconds for players to see the result
                setTimeout(() => nextTurn(code), 10000);
            } else {
                // Next round (flop/turn/river)
                console.log("Nowa runda, emituję next_round i nextTurn dla:", code);
                io.to(code).emit("next_round");
                await nextTurn(code);
            }
        } else {
            console.log("Następna tura");
            await nextTurn(code);
        }
    }

    io.on("connection", (socket) => {
        const joinRoom = (code) => {
            socket.join(code);
            console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} joined room ${code}`);
            io.to(code).emit("refresh_list");
        }

        socket.on("auth", async (playerId) => {
            console.log(`Received auth event for playerId: ${playerId}`);
            if (disconnectTimeouts[playerId]) {
                clearTimeout(disconnectTimeouts[playerId]);
                delete disconnectTimeouts[playerId];
            }

            const user = await GetUserById(playerId);
            if (user) {
                const game = await GetGameById(user.game_id);
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
            await nextTurn(code);
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

            io.to(moveData.gameCode).emit("player_moved", {
                playerId: moveData.playerId,
                action: moveData.action,
                raiseValue: moveData.raiseValue
            });

            console.log("Res: ", res);
            await handleMoveResult(res, moveData.gameCode);
        });

        socket.on("disconnect", async () => {
            console.log("A user disconnected");
            if (socket.userData) {
                console.log(`Player ${socket.userData.username} with id ${socket.userData.playerId} has disconnected from the websocket. Waiting 5 seconds before removing from the game...`);

                disconnectTimeouts[socket.userData.playerId] = setTimeout(async () => {
                    try {
                        const {playerId, code, username} = socket.userData;
                        const gameStatus = await GetGameStatus(code);
                        if (gameStatus == "waiting") {
                            await LeaveGame(playerId);
                            io.to(code).emit("refresh_list");
                            delete disconnectTimeouts[playerId];
                            return;
                        } else {
                            io.to(code).emit("player_disconnected", {playerId, username});
                            delete disconnectTimeouts[playerId];
                            return;
                        }
                    } catch (err) {
                        console.error("An error occured during deleting player: ", err);
                    }
                }, 5000);
            }
        });
    }); 
}


export default createWebsocketServer;