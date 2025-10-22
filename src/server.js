require('dotenv').config()
const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyze');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota principal da API
app.use('/api/analyze', analyzeRoute);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});