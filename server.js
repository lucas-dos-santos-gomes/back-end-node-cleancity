const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const express = require('express');
const app = express();
app.use(express.json());

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('usuarios').doc(userRecord.uid).set({
      email,
      name,
    });

    res.status(201).send('Usuário cadastrado com sucesso');
  } catch (error) {
    res.status(400).send(`Erro ao cadastrar usuário: ${error.message}`);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    if(password != user.password) {
      res.status(400).send(`Senha incorreta`);
      return;
    }
    const customToken = await admin.auth().createCustomToken(user.uid);
    res.status(200).send('Login realizado com sucesso', { customToken });
  } catch (error) {
    res.status(400).send(`Erro ao realizar login: ${error.message}`);
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuariosSnapshot = await db.collection('usuarios').get();
    const usuariosList = usuariosSnapshot.docs.map(doc => doc.data());
    res.status(200).json(usuariosList);
  } catch (error) {
    res.status(500).send(`Erro ao buscar usuários: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
