const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'biHsnoIykWpsdxXhwlSvJpBgKAWrVYOG',
  database: 'railway'
});

db.connect((err) => {
  if (err) return;
  console.log('Conectado ao banco de dados MySQL');
});

app.listen(5000, () => {
  console.log('Servidor rodando na porta 3000');
});

// Rota de cadastro
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const query = 'INSERT INTO User (email, password) VALUES (?, ?)';
  db.query(query, [email, hashedPassword], (err, result) => {
    if (err) return res.status(500).send('Erro ao registrar o usuário');
    res.status(201).send('Usuário registrado com sucesso');
  });
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM User WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).send('Erro ao buscar o usuário');
    if (results.length === 0) return res.status(404).send('Usuário não encontrado');

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send('Senha inválida');

    const token = jwt.sign({ id: user.id }, 'segredo', { expiresIn: 86400 });
    res.status(200).send({ auth: true, token });
  });
});

// Rota para listar todos os usuários
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM User';
  db.query(query, (err, results) => {
    if (err) return res.status(500).send('Erro ao buscar usuários');
    res.status(200).json(results);
  });
});
