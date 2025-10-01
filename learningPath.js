const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate learning path
router.post('/generate', auth, async (req, res) => {
  try {
    const { careerGoal } = req.body;
    const user = req.user;

    // AI-generated learning paths based on career goal
    const pathTemplates = {
      'AI Engineer': {
        title: 'AI Engineering Mastery Path',
        description: 'Complete roadmap to become an AI Engineer',
        modules: [
          'Python Programming Fundamentals',
          'Mathematics for AI',
          'Machine Learning Basics',
          'Deep Learning with Neural Networks',
          'Computer Vision',
          'Natural Language Processing',
          'AI Project Portfolio'
        ]
      },
      'Data Scientist': {
        title: 'Data Science Professional Path',
        description: 'Comprehensive path to master data science',
        modules: [
          'Statistics and Probability',
          'Python for Data Science',
          'Data Manipulation with Pandas',
          'Data Visualization',
          'Machine Learning Algorithms',
          'SQL and Databases',
          'Data Science Capstone Project'
        ]
      },
      'ML Engineer': {
        title: 'Machine Learning Engineering Path',
        description: 'Technical path to deploy ML models in production',
        modules: [
          'Programming for ML',
          'Machine Learning Fundamentals',
          'Model Training and Validation',
          'MLOps and Model Deployment',
          'Cloud Platforms for ML',
          'Production ML Systems'
        ]
      }
    };

    const learningPath = pathTemplates[careerGoal] || pathTemplates['AI Engineer'];
    learningPath.progress = 0;

    // Save to user
    user.learningPaths.push(learningPath);
    await user.save();

    res.json({
      success: true,
      message: 'Learning path generated successfully',
      learningPath
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get learning paths
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      success: true,
      learningPaths: user.learningPaths
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
