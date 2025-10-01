const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    careerGoal: {
      type: String,
      enum: ['AI Engineer', 'Data Scientist', 'ML Engineer'],
      required: true
    },
    educationLevel: {
      type: String,
      enum: ['B.Tech', 'BSc', 'Diploma'],
      required: true
    },
    learningStyle: {
      type: String,
      enum: ['Visual', 'Auditory', 'Kinesthetic'],
      required: true
    }
  },
  learningPaths: [{
    title: String,
    description: String,
    progress: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
