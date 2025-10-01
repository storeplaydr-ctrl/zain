const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// AI Mentor Chat
router.post('/mentor', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    // Simple AI responses based on user profile
    const responses = {
      'AI Engineer': [
        'For AI engineering, focus on Python and TensorFlow first.',
        'Deep learning is crucial. Start with neural network basics.',
        'Computer vision and NLP are key AI engineering skills.'
      ],
      'Data Scientist': [
        'Statistics and Python are fundamental for data science.',
        'Master pandas, matplotlib, and scikit-learn.',
        'Practice with real datasets to build your portfolio.'
      ],
      'ML Engineer': [
        'MLOps is essential for ML engineers.',
        'Learn Docker, Kubernetes for model deployment.',
        'Focus on production-ready ML systems.'
      ]
    };

    const careerResponses = responses[user.profile.careerGoal] || responses['AI Engineer'];
    const aiResponse = careerResponses[Math.floor(Math.random() * careerResponses.length)];

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
