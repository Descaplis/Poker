import dotenv from 'dotenv';
dotenv.config();
import { createServer } from "http";
import { pool, createGame, joinGame, startGame, Raise, Fold, Check, GetListOfPlayers, GetMaximumRaiseValue, GetPlayerCards, GetCurrentTurnSeat, GetSmallBlindSeat, GetBigBlindSeat, GetCardsOnTable } from './db.mjs';
import express from "express";

const app = express();
app.use(express.json());

app.get("/",(req, res) => {
    res.json({message: "Test"});
});

app.post("/createGame", async (req, res) => {
    if (req.body.playersAmount == null || req.body.timeForMove == null || req.body.smallBlindValue == null ||  req.body.initialBalance == null || req.body.username == null) {
        res.json({success: false});
        return;
    }
    const gameId = await createGame(req.body.playersAmount, req.body.timeForMove, req.body.smallBlindValue, req.body.initialBalance, req.body.username);
    res.json({gameId});
});

app.post("/joinGame", async (req, res) => {
    if (req.body.code == null || req.body.username == null) {
        res.json({success: false});
        return;
    }
    const result = await joinGame(req.body.username, req.body.code);
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

app.post("/startGame", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const result = await startGame(req.body.code);
    res.json({result})
});

app.post("/raise", async (req, res) => {
    if (req.body.code == null || req.body.seat == null || req.body.amount  == null) {
        res.json({success: false});
        return;
    }
    const raise = await Raise(req.body.code, req.body.seat, req.body.amount);
    res.json({raise})
});

app.post("/fold", async (req, res) => {
    if (req.body.code == null || req.body.seat == null) {
        res.json({success: false});
        return;
    }
    const fold = await Fold(req.body.code, req.body.seat);
    res.json({fold})
});

app.post("/check", async (req, res) => {
    if (req.body.code == null || req.body.seat == null) {
        res.json({success: false});
        return;
    }
    const check = await Check(req.body.code, req.body.seat);
    res.json({check})
});

app.post("/getPlayerCards", async (req, res) => {
    if (req.body.code == null || req.body.seat == null) {
        res.json({success: false});
        return;
    }
    const cards = await GetPlayerCards(req.body.code, req.body.seat);
    res.json({cards})
});

app.post("/getCurrentTurnSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetCurrentTurnSeat(req.body.code);
    res.json({seat})
});

app.get("/getSmallBlindSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetSmallBlindSeat(req.body.code);
    res.json({seat})
});

app.get("/getBigBlindSeat", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const seat = await GetBigBlindSeat(req.body.code);
    res.json({seat})
});

app.get("/getCardsOnTable", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const cards = await GetCardsOnTable(req.body.code);
    res.json({cards})
});

app.get("/getMaximumRaiseValue", async (req, res) => {
    if (req.body.code == null) {
        res.json({success: false});
        return;
    }
    const maxRaise = await GetMaximumRaiseValue(req.body.code);
    res.json({maxRaise});
});

const httpServer = createServer(app);
httpServer.listen(8080, ()=>{console.log("Server started on port 8080")});