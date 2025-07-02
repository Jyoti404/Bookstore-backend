const fs = require('fs').promises;
const path = require('path');

const BOOKS_FILE = path.join(__dirname, '..', 'data', 'books.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function initializeDataFiles() {
  await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
  try { await fs.access(BOOKS_FILE); } catch { await fs.writeFile(BOOKS_FILE, '[]'); }
  try { await fs.access(USERS_FILE); } catch { await fs.writeFile(USERS_FILE, '[]'); }
}

async function readBooks() {
  const data = await fs.readFile(BOOKS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeBooks(books) {
  await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2));
}

async function readUsers() {
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

module.exports = {
  initializeDataFiles,
  readBooks,
  writeBooks,
  readUsers,
  writeUsers
};
