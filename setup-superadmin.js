require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Load User model
    const User = require('./models/User');

    // Hash the password properly
    const hashedPassword = await bcrypt.hash('super@123', 10);

    // Check if superadmin exists
    const existing = await User.findOne({ role: 'superadmin' });

    if (existing) {
      // Use updateOne to bypass pre-save hook (password already hashed)
      await User.updateOne(
        { role: 'superadmin' },
        { $set: { email: 'super@gmail.com', password: hashedPassword } }
      );
      console.log('✅ Super Admin updated!');
    } else {
      // Insert directly to bypass pre-save hook
      await User.collection.insertOne({
        name: 'Super Admin',
        email: 'super@gmail.com',
        password: hashedPassword,
        role: 'superadmin',
        phone: '9999999999',
        isActive: true,
        createdAt: new Date()
      });
      console.log('✅ Super Admin created!');
    }

    // Verify
    const admin = await User.findOne({ role: 'superadmin' });
    const match = await bcrypt.compare('super@123', admin.password);
    console.log('Password verification:', match ? '✅ PASS' : '❌ FAIL');
    console.log('Email:', admin.email);
    console.log('\nLogin credentials:');
    console.log('Email:    super@gmail.com');
    console.log('Password: super@123');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setupSuperAdmin();
