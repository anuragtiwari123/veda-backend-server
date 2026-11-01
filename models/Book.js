const mongoose = require('mongoose');

const BookSchema =
  new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },

    pdfUrl: {
      type: String,
      required: true,
    },

    category: {
      type: String,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },
  });

module.exports =
  mongoose.model(
    'Book',
    BookSchema
  );