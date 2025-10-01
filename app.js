// ExNebula Frontend Application
class ExNebulaApp {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.authToken = localStorage.getItem('authToken');
    this.apiBase = '/api';
    this.init();
  }

  init() {
    this.initSocketIO();
    this.attachEventListeners();
    this.checkAuthStatus();
  }

  initSocketIO() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (this.currentUser) {
        this.socket.emit('join-chat', {
          name: this.currentUser.name,
          id: this.currentUser.id
        });
      }
    });

    this.socket.on('community-message', (message) => {
      this.displayCommunityMessage(message);
    });

    this.socket.on('mentor-response', (response) => {
      this.displayMentorMessage(response.text, false);
    });
  }

  attachEventListeners() {
    // Navigation
    document.getElementById('nav-home')?.addEventListener('click', () => this.showNotification('Home section', 'info'));
    document.getElementById('nav-courses')?.addEventListener('click', () => this.showNotification('Courses coming soon!', 'info'));
    document.getElementById('nav-careers')?.addEventListener('click', () => this.showNotification('Career section coming soon!', 'info'));
    document.getElementById('btn-login')?.addEventListener('click', () => this.showModal());

    // Main actions
    document.getElementById('btn-get-started')?.addEventListener('click', () => this.handleGetStarted());
    document.getElementById('btn-generate-path')?.addEventListener('click', () => this.generateLearningPath());
    document.getElementById('btn-send-mentor')?.addEventListener('click', () => this.sendMentorMessage());
    document.getElementById('btn-send-chat')?.addEventListener('click', () => this.sendCommunityMessage());

    // Modal actions
    document.getElementById('btn-register')?.addEventListener('click', () => this.handleRegister());
    document.getElementById('btn-login-modal')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('btn-close')?.addEventListener('click', () => this.closeModal());

    // Enter key handlers
    document.getElementById('mentor-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMentorMessage();
      }
    });

    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendCommunityMessage();
      }
    });
  }

  async checkAuthStatus() {
    if (this.authToken) {
      try {
        const response = await this.apiCall('/auth/profile', 'GET');
        if (response.success) {
          this.currentUser = response.user;
          this.updateUIForLoggedInUser();
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    }
  }

  async apiCall(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (this.authToken) {
      config.headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(this.apiBase + endpoint, config);
    return await response.json();
  }

  async handleRegister() {
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      careerGoal: document.getElementById('career-goal').value,
      educationLevel: document.getElementById('education-level').value,
      learningStyle: document.getElementById('learning-style').value
    };

    if (!this.validateForm(formData)) return;

    try {
      const response = await this.apiCall('/auth/register', 'POST', formData);

      if (response.success) {
        this.authToken = response.token;
        this.currentUser = response.user;
        localStorage.setItem('authToken', this.authToken);

        this.updateUIForLoggedInUser();
        this.closeModal();
        this.showNotification('Registration successful! Welcome to ExNebula!', 'success');

        if (this.socket) {
          this.socket.emit('join-chat', {
            name: this.currentUser.name,
            id: this.currentUser.id
          });
        }
      } else {
        this.showNotification(response.message || 'Registration failed', 'error');
      }
    } catch (error) {
      this.showNotification('Registration failed. Please try again.', 'error');
    }
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showNotification('Please enter email and password', 'error');
      return;
    }

    try {
      const response = await this.apiCall('/auth/login', 'POST', { email, password });

      if (response.success) {
        this.authToken = response.token;
        this.currentUser = response.user;
        localStorage.setItem('authToken', this.authToken);

        this.updateUIForLoggedInUser();
        this.closeModal();
        this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');

        if (this.socket) {
          this.socket.emit('join-chat', {
            name: this.currentUser.name,
            id: this.currentUser.id
          });
        }
      } else {
        this.showNotification(response.message || 'Login failed', 'error');
      }
    } catch (error) {
      this.showNotification('Login failed. Please try again.', 'error');
    }
  }

  async generateLearningPath() {
    if (!this.currentUser) {
      this.showNotification('Please login to generate learning path', 'error');
      return;
    }

    const careerGoal = document.getElementById('career-path-select').value;
    if (!careerGoal) {
      this.showNotification('Please select a career goal', 'error');
      return;
    }

    try {
      const response = await this.apiCall('/learning-path/generate', 'POST', { careerGoal });

      if (response.success) {
        this.displayLearningPath(response.learningPath);
        this.showNotification('Learning path generated successfully!', 'success');
      } else {
        this.showNotification('Failed to generate learning path', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to generate learning path', 'error');
    }
  }

  async sendMentorMessage() {
    if (!this.currentUser) {
      this.showNotification('Please login to chat with AI mentor', 'error');
      return;
    }

    const messageInput = document.getElementById('mentor-input');
    const message = messageInput.value.trim();

    if (!message) return;

    this.displayMentorMessage(message, true);
    messageInput.value = '';

    try {
      const response = await this.apiCall('/chat/mentor', 'POST', { message });

      if (response.success) {
        this.displayMentorMessage(response.response, false);
      }
    } catch (error) {
      this.showNotification('Failed to send message', 'error');
    }
  }

  sendCommunityMessage() {
    if (!this.currentUser) {
      this.showNotification('Please login to participate in community chat', 'error');
      return;
    }

    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();

    if (!message) return;

    if (this.socket) {
      this.socket.emit('community-message', {
        text: message,
        user: this.currentUser.name
      });
      messageInput.value = '';
    }
  }

  displayLearningPath(learningPath) {
    const container = document.createElement('div');
    container.className = 'learning-path-result';
    container.innerHTML = `
      <h3>${learningPath.title}</h3>
      <p>${learningPath.description}</p>
      <div class="modules">
        ${learningPath.modules.map((module, index) => `
          <div class="module">
            <strong>Module ${index + 1}:</strong> ${module}
          </div>
        `).join('')}
      </div>
      <div class="progress">Progress: ${learningPath.progress}%</div>
    `;

    const section = document.querySelector('.section h2').parentNode;
    const existing = section.querySelector('.learning-path-result');
    if (existing) {
      existing.replaceWith(container);
    } else {
      section.appendChild(container);
    }
  }

  displayMentorMessage(message, isUser) {
    const container = this.getMentorChatContainer();
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : ''}`;
    messageDiv.innerHTML = `
      <div><strong>${isUser ? 'You' : 'AI Mentor'}:</strong> ${message}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  displayCommunityMessage(message) {
    const container = this.getCommunityChatContainer();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
      <div><strong>${message.user}:</strong> ${message.text}</div>
      <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  getMentorChatContainer() {
    let container = document.getElementById('mentor-chat-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mentor-chat-container';
      container.className = 'chat-messages';
      const mentorSection = document.querySelector('#btn-send-mentor').parentNode;
      mentorSection.insertBefore(container, document.getElementById('mentor-input'));
    }
    return container;
  }

  getCommunityChatContainer() {
    let container = document.getElementById('community-chat-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'community-chat-container';
      container.className = 'chat-messages';
      const chatSection = document.querySelector('#btn-send-chat').parentNode;
      chatSection.insertBefore(container, document.getElementById('chat-input'));
    }
    return container;
  }

  showModal() {
    document.querySelector('.modal').style.display = 'block';
  }

  closeModal() {
    document.querySelector('.modal').style.display = 'none';
    this.clearForm();
  }

  clearForm() {
    const inputs = document.querySelectorAll('.modal input, .modal select');
    inputs.forEach(input => input.value = '');
  }

  updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.textContent = `Hello, ${this.currentUser.name}`;
    }
  }

  showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  validateForm(formData) {
    const required = ['name', 'email', 'password', 'careerGoal', 'educationLevel', 'learningStyle'];
    for (const field of required) {
      if (!formData[field]) {
        this.showNotification(`Please fill in ${field}`, 'error');
        return false;
      }
    }
    return true;
  }

  handleGetStarted() {
    if (!this.currentUser) {
      this.showModal();
    } else {
      this.showNotification('Welcome! Start by generating your personalized learning path.', 'info');
    }
  }

  logout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('authToken');

    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.textContent = 'Login / Sign Up';
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.exNebulaApp = new ExNebulaApp();
});
