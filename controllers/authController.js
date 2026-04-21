const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).render('auth/register', { 
        error: 'All fields are required' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('auth/register', { 
        error: 'Passwords do not match' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('auth/register', { 
        error: 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'user'
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.token = token;
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('auth/register', { 
      error: 'Registration failed' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('auth/login', { 
        error: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render('auth/login', { 
        error: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).render('auth/login', { 
        error: 'Invalid email or password' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.token = token;
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      hotelId: user.hotelId ? user.hotelId.toString() : null,
      department: user.department || null
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('auth/login', { 
      error: 'Login failed' 
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.redirect('/');
  });
};
