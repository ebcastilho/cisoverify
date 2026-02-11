const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "data", "users.json");

function load() {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function createUser(user) {
  const users = load();

  user.id = users.length + 1;
  users.push(user);

  save(users);
  return user;
}

function findByEmail(email) {
  return load().find(u => u.email === email);
}

function getUserById(id) {
  return load().find(u => u.id === id);
}

function getAllUsers() {
  return load();
}

function deleteUser(id) {
  const users = load().filter(u => u.id !== id);
  save(users);
}

module.exports = {
  createUser,
  findByEmail,
  getUserById,
  getAllUsers,
  deleteUser
};
