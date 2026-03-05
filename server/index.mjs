import dotenv from 'dotenv';
dotenv.config();
import { createServer } from "http";
import { pool } from './db.mjs';
import express from "express";

const app = express();
app.use(express.json());

app.get("/",(req, res) => {
    res.json({message: "Hello World"});
});

const httpServer = createServer(app);
httpServer.listen(8080, ()=>{console.log("Server started on port 8080")});