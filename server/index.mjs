import dotenv from 'dotenv';
dotenv.config();
import { createServer } from "http";
import { CreateGame, JoinGame, startGame, Raise, Fold, Check, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetCurrentBet, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable, GetTimeForMove, GetPots, GetTurnEndTime } from './db.mjs';
import express from "express";
import createWebsocketServer from "./websocket.mjs";
import cors from "cors";
export const allowedOrigins = ["http://localhost:3000", "http://192.168.88.14:3000", "http://192.168.88.29:3000"];

const app = express();
app.use(express.json());
app.use(cors({origin:allowedOrigins}));

app.post("/createGame", async (req, res) => {
    console.log(req.body)
    if (req.body.playersAmount == null || req.body.timeForMove == null || req.body.smallBlindValue == null ||  req.body.initialBalance == null || req.body.username == null) {
        res.json({success: false});
        return;
    }
    const game = await CreateGame(req.body.playersAmount, req.body.timeForMove, req.body.smallBlindValue, req.body.initialBalance, req.body.username);
    res.json({game});
});

app.post("/joinGame", async (req, res) => {
    if (req.body.code == null || req.body.username == null) {
        res.json({success: false});
        return;
    }
    const result = await JoinGame(req.body.username, req.body.code);
    res.json({result});
});

app.post("/getListOfPlayers", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const players = await GetListOfPlayers(req.body.code);
    res.json({players});
});

app.post("/getCurrentTurnSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetCurrentTurnSeat(req.body.code);
    res.json({seat});
});

app.post("/getCurrentBet", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const currentBet = await GetCurrentBet(req.body.code);
    res.json({currentBet});
});

app.post("/getSmallBlindSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetSmallBlindSeat(req.body.code);
    res.json({seat});
});

app.post("/getBigBlindSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetBigBlindSeat(req.body.code);
    res.json({seat});
});

app.post("/getCardsOnTable", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const cards = await GetCardsOnTable(req.body.code);
    res.json({cards});
});

app.post("/getTimeForMove", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const time = await GetTimeForMove(req.body.code);
    res.json({time});
});

app.post("/getMaximumRaiseValue", async (req, res) => {
    if (req.body.playerId == null) {
        res.json({success: false});
        return;
    }
    const maxRaise = await GetMaximumRaiseValue(req.body.playerId);
    res.json({maxRaise});
});

app.post("/getPots", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const pots = await GetPots(req.body.code);
    res.json({pots});
});

app.post("/getTurnEndTime", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const endTime = await GetTurnEndTime(req.body.code);
    res.json({endTime});
});

const httpServer = createServer(app);
httpServer.listen(8080, ()=>{console.log("Server started on port 8080")});
createWebsocketServer(httpServer);