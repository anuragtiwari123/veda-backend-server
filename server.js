const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config();

const Question = require('./models/Question');
const Book = require('./models/Book');
const User = require('./models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(cors());

/* ==========================
   MongoDB Connection
========================== */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.log('❌ MongoDB Error:', err.message);
  });

/* ==========================
   Razorpay Setup
========================== */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ==========================
   BOOK APIs
========================== */

// Add Book
app.post('/api/admin/add-book', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json({
      success: true,
      message: 'Book Added Successfully',
      book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get All Books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* ==========================
   QUESTION APIs
========================== */

// Upload Question
app.post('/api/admin/upload-question', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json({
      success: true,
      message: 'Question Uploaded Successfully',
      question,
    });
  } catch (error) {
    console.error("❌ Question Save Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Bulk Upload Quiz / Questions (Multiple Questions at once)
app.post(['/api/admin/upload-quiz', '/api/admin/bulk-upload', '/api/admin/upload-questions'], async (req, res) => {
  try {
    const data = req.body;
    let questionsArray = [];

    if (Array.isArray(data)) {
      questionsArray = data;
    } else if (data.questions && Array.isArray(data.questions)) {
      questionsArray = data.questions;
    } else {
      questionsArray = [data];
    }

    const savedQuestions = await Question.insertMany(questionsArray);
    console.log(`✅ Successfully uploaded ${savedQuestions.length} questions to MongoDB Cloud.`);

    res.status(201).json({
      success: true,
      message: 'Quiz/Questions Uploaded Successfully to Cloud',
      count: savedQuestions.length,
      questions: savedQuestions
    });
  } catch (error) {
    console.error("❌ Bulk Upload Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get Questions By Exam Type
// परीक्षा श्रेणी, नाम और विषय के हिसाब से सवाल फ़ेच करने का रूट
app.get('/api/questions/:examType/:examSubCategory/:subject', async (req, res) => {
  try {
    const { examType, examSubCategory, subject } = req.params;

    const questions = await Question.find({
      examType: examType,
      examSubCategory: examSubCategory,
      subject: subject
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   USER APIs
========================== */

// Create User
app.post('/api/user/create', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Get User By ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Update User Profile
app.put('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        targetExam: req.body.targetExam,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }

    res.json({
      success: true,
      message: 'Profile Updated Successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* ==========================
   SETTINGS APIs
========================== */

// Update Settings
app.put('/api/user/:id/settings', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          settings: req.body,
        },
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }

    res.json({
      success: true,
      message: 'Settings Updated Successfully',
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* ==========================
   TEST HISTORY APIs
========================== */

// Reset Mock Test History
app.delete('/api/user/:id/reset-history', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        testHistory: [],
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }

    res.json({
      success: true,
      message: 'History Reset Successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* ==========================
   NODEMAILER SETUP & AUTH APIs
========================== */

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Authentication API: Forget Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes valid
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Mockers Password Reset',
      html: `
        <h2>Reset Password</h2>
        <p>Click below button to reset your password</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link is valid for 10 minutes only.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Reset Link Sent',
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Reset Password API
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Or Expired Token',
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password Reset Successful',
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* ==========================
   PAYMENT APIs
========================== */

// Create Razorpay Order (Updated for logging errors)
app.post('/api/payment/order', async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("📥 Incoming order initialization for amount:", amount);

    const options = {
      amount: amount || 9900, // पैसे के रूप में (₹99 = 9900 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created Successfully:", order.id);
    res.json(order);
  } catch (error) {
    console.error("❌ Razorpay SDK Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Premium Activate After Payment (🟢 फिक्स किया गया)
app.post('/api/payment/success', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("👑 Activating Premium status for User ID:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { premium: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Not Found',
      });
    }

    res.json({
      success: true,
      message: 'Premium Activated Successfully',
    });
  } catch (error) {
    console.error("❌ Payment Success Activation Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ==========================
   Server Start
========================== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Professional Server running on network port ${PORT}`);
});