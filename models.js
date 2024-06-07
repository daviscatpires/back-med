const questionnaireSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    procedureType: String,
    answers: Array,
    result: String,
  });
  
  const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);
  