const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

const mongoURI = 'mongodb+srv://usermed:lasanha12@serverlessinstance0.n9rdiyu.mongodb.net/?retryWrites=true&w=majority&appName=ServerlessInstance0&tls=true&tlsAllowInvalidCertificates=true';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error: ', err));


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const questionnaireSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  procedureType: String,
  answers: Object,
  result: String,
});

const User = mongoose.model('User', userSchema);
const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    console.log('User not found');
    return res.status(401).send('Invalid credentials');
  }
  
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    console.log('Password mismatch');
    return res.status(401).send('Invalid credentials');
  }
  
  const token = jwt.sign({ id: user._id }, 'secret_key');
  console.log('Login successful, token generated:', token);
  res.json({ token });
});


const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.user = decoded;
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
};

// Função para calcular a idade a partir da data de nascimento
function calculateAge(birthdate) {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

app.post('/questionnaire', auth, async (req, res) => {
  console.log('Received data:', req.body); // Log received data
  const { procedureType, answers } = req.body;

  // Calcular idade a partir da data de nascimento
  const idade = calculateAge(answers.nascimento);

  // Atualizar answers com a idade calculada
  answers.idade = idade;

  let result = 'Procedimento não autorizado';
  
  // Obtendo os dados necessários do corpo da requisição
  const { IMC, tentouEmagrecer, obesidadeCincoAnos, varizesGrossoCalibre, quadroAnteriorTrombose, sexo, condicaoPrevia, dorIncapacitanteDiaria, desgasteArticulacaoQuadril40 } = answers;

  // Verificando o tipo de procedimento e aplicando os critérios
  switch (procedureType) {
    case 'cirurgiaBariatrica':
      if (idade >= 18 && idade <= 65 &&
          ((IMC >= 35 && IMC <= 39.9) || IMC >= 40) &&
          tentouEmagrecer && obesidadeCincoAnos) {
        result = 'Procedimento autorizado';
      }
      break;
    case 'cirurgiaVarizes':
      if (idade >= 30 && idade <= 65 &&
          varizesGrossoCalibre && quadroAnteriorTrombose &&
          sexo === 'F') {
        result = 'Procedimento autorizado';
      }
      break;
    case 'artroplastia':
      if (idade > 60 &&
          condicaoPrevia && dorIncapacitanteDiaria &&
          desgasteArticulacaoQuadril40) {
        result = 'Procedimento autorizado';
      }
      break;
    default:
      break;
  }

  // Salvando o questionário no banco de dados
  const questionnaire = new Questionnaire({ userId: req.user.id, procedureType, answers, result });
  await questionnaire.save();

  res.json({ result });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
