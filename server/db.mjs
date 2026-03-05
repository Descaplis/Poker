// lib/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Konfiguracja połączenia na podstawie zmiennych środowiskowych
console.log(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD, process.env.DB_PORT);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

function createUserTable() {
  const query = `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL, 
  email VARCHAR(100) NOT NULL)`;
  return pool.query(query);
}
createUserTable();
// Eksportujemy funkcję do wykonywania zapytań
export { pool };