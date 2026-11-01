const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
  },

  mobile: {
    type: String,
    default: '',
  },

  profileImage: {
    type: String,
    default: '',
  },

  premium: {
    type: Boolean,
    default: false,
  },

  premiumExpiry: {
    type: Date,
  },

  targetExam: {
    type: String,
    default: 'SSC CGL',
  },

  rank: {
    type: Number,
    default: 0,
  },

  coins: {
    type: Number,
    default: 0,
  },

  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },

    darkMode: {
      type: Boolean,
      default: false,
    },

    timerStyle: {
        type: String,
        default: "Count Down",

        },

    soundEffects: {
      type: Boolean,
      default: true,
    },
  },

  bookmarkedBooks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],

  bookmarkedQuestions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
  ],

  testHistory: [
    {
      testName: String,

      score: Number,

      totalQuestions: Number,

      correctAnswers: Number,

      wrongAnswers: Number,

      accuracy: Number,

      timeTaken: Number,

      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],


  resetPasswordToken: {
    type: String,
    default: null,
  },

  resetPasswordExpire: {
    type: Date,
    default: null,
  },






  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  'User',
  userSchema
);