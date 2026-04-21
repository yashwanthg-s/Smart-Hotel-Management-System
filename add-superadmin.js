require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function addSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({email: 'superadmin@hotel.com'});
    if (existingAdmin) {
      console.log('Super Admin already exists!');
      console.log('Email: superadmin@hotel.com');
      console.log('Password: superadmin123');
      process.exit(0);
    }

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@hotel.com',
      password: 'superadmin123',
      phone: '9999999999',
      role: 'superadmin'
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Email:    superadmin@hotel.com');
    console.log('Password: superadmin123');
    console.log('─────────────────────────────────────\n');
    console.log('Go to http://localhost:3000/login and login with these credentials');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addSuperAdmin();
