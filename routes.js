// Endpoint para enviar questionário
app.post('/questionnaire', auth, async (req, res) => {
    const { procedureType, answers } = req.body;
  
    // Validação dos critérios
    let result = 'Procedimento não autorizado';
    if (procedureType === 'Cirurgia bariátrica' && answers.includes('criteria1')) {
      result = 'Procedimento autorizado';
    }
    // Adicione outras validações aqui
  
    const questionnaire = new Questionnaire({ userId: req.user.id, procedureType, answers, result });
    await questionnaire.save();
  
    res.json({ result });
  });
  