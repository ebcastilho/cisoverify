const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");

const users = require("./users");
const invites = require("./invites");
const connections = require("./connections");

const app = express();
const PORT = process.env.PORT || 3000;

/* TEMPLATE */
function renderPage(content) {
  const layout = fs.readFileSync(
    path.join(__dirname, "public", "layout.html"),
    "utf-8"
  );
  return layout.replace("{{CONTENT}}", content);
}

/* SESSION */
app.use(session({
  secret: "cisoverify-secret",
  resave: false,
  saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* HOME */
app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/profile");

  const loginPage = fs.readFileSync(
    path.join(__dirname, "public", "login.html"),
    "utf-8"
  );

  res.send(renderPage(loginPage));
});

/* UPLOAD */
const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* LOGIN */
app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/profile");

  const loginPage = fs.readFileSync(
    path.join(__dirname, "public", "login.html"),
    "utf-8"
  );

  res.send(renderPage(loginPage));
});

app.post("/login", async (req, res) => {
  const user = users.findByEmail(req.body.email);
  if (!user) return res.send("Usuário não encontrado");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.send("Senha inválida");

  req.session.userId = user.id;
  res.redirect("/profile");
});

/* LOGOUT */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/* REGISTER */
app.get("/register", (req, res) => {
  if (!invites.isValidInvite(req.query.invite)) {
    return res.send("Convite inválido");
  }

  const registerPage = fs.readFileSync(
    path.join(__dirname, "public", "register.html"),
    "utf-8"
  );

  res.send(renderPage(registerPage));
});

app.post("/register", upload.single("photo"), async (req, res) => {

  const hash = await bcrypt.hash(req.body.password, 10);

  users.createUser({
    name: req.body.name,
    email: req.body.email,
    company: req.body.company,
    password: hash,
    photo: req.file
      ? "/uploads/" + req.file.filename
      : "/uploads/cisouser.png"
  });

  invites.markInviteAsUsed(req.query.invite);
  res.redirect("/");
});

/* PROFILE */
app.get("/profile", (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  const user = users.getUserById(req.session.userId);

  res.send(renderPage(`
    <h2>Perfil de: ${user.name}</h2>

    <img src="${user.photo}" width="120"><br><br>

    <b>Email:</b> ${user.email}<br>
    <b>Empresa:</b> ${user.company}<br><br>

    <a href="/invite">Convidar</a><br>
    <a href="/users">Encontrar pessoas</a><br>
    <a href="/connections">Minhas conexões</a><br>
    <a href="/logout">Sair</a>
  `));
});

/* ===== INVITE ===== */
app.get("/invite", (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  const invite = invites.generateInvite(req.session.userId);

  res.send(renderPage(`
    <h2>Convite gerado</h2>

    <p>Envie este link para o convidado:</p>

    <div style="padding:10px;background:#f4f4f4;border-radius:6px">
      http://localhost:3000/register?invite=${invite.code}
    </div>

    <br><a href="/profile">Voltar</a>
  `));
});

/* ===== LISTAR USUÁRIOS ===== */
app.get("/users", (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  const list = users.getAllUsers().filter(u => u.id !== req.session.userId);

  let html = "<h2>Encontrar pessoas</h2>";

  list.forEach(u => {
    html += `
      <div style="margin-bottom:15px">
        <img src="${u.photo}" width="60" style="border-radius:6px"><br>
        <b>${u.name}</b><br>
        ${u.company}
        <form method="POST" action="/connect">
          <input type="hidden" name="toUserId" value="${u.id}">
          <button type="submit">Conectar</button>
        </form>
      </div>
      <hr>
    `;
  });

  res.send(renderPage(html));
});

/* ===== CONECTAR ===== */
app.post("/connect", (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  connections.addConnection(req.session.userId, Number(req.body.toUserId));
  res.redirect("/connections");
});

/* ===== CONEXÕES ===== */
app.get("/connections", (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  const list = connections.getConnections(req.session.userId);

  let html = "<h2>Minhas conexões</h2>";

  list.forEach(c => {
    const user = users.getUserById(c.to);
    if (!user) return;

    html += `
      <div style="margin-bottom:15px">
        <img src="${user.photo}" width="60" style="border-radius:6px"><br>
        <b>${user.name}</b><br>
        ${user.company}
      </div>
      <hr>
    `;
  });

  res.send(renderPage(html));
});


/* START */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
