const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // 1. मुख्य परीक्षा श्रेणी (जैसे: SSC Exams, Railways, Defence)
  examType: { type: String, required: true },

  // 2. परीक्षा का नाम (जैसे: MTS, CGL, Group D, NDA)
  examSubCategory: { type: String, required: true },

  // 3. विषय (जैसे: History, Geography, Math, Reasoning)
  subject: { type: String, required: true },

  // बाकी पुराने फ़ील्ड्स वैसे ही रहेंगे
  questionTextEn: { type: String, required: true },
  questionTextHi: { type: String, required: true },
  optionsEn: [ { type: String, required: true } ],
  optionsHi: [ { type: String, required: true } ],
  correctOptionIndex: { type: Number, required: true },
  positiveMarks: { type: Number, default: 2.0 },
  negativeMarks: { type: Number, default: 0.25 }
});

module.exports = mongoose.model('Question', QuestionSchema);