require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Hotel = require('./models/Hotel');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@hotel.com',
      password: 'superadmin123',
      phone: '9999999999',
      role: 'superadmin'
    });
    console.log('✓ Super Admin created:', superAdmin.email);

    // Create a hotel first
    const hotel = await Hotel.create({
      name: 'Grand Hotel',
      description: 'Luxury 5-star hotel',
      address: '123 Main Street, City',
      latitude: 28.7041,
      longitude: 77.1025,
      phone: '9876543210',
      email: 'hotel@example.com',
      adminId: superAdmin._id,
      modules: {
        foodSystem: true,
        roomBooking: true
      }
    });
    console.log('✓ Hotel created:', hotel.name);

    // Create Admin
    const admin = await User.create({
      name: 'Hotel Admin',
      email: 'admin@hotel.com',
      password: 'admin123',
      phone: '9888888888',
      role: 'admin',
      hotelId: hotel._id
    });
    console.log('✓ Admin created:', admin.email);

    // Create Staff
    const staff = await User.create({
      name: 'Kitchen Staff',
      email: 'staff@hotel.com',
      password: 'staff123',
      phone: '9777777777',
      role: 'staff',
      hotelId: hotel._id,
      department: 'kitchen'
    });
    console.log('✓ Staff created:', staff.email);

    // Create Regular User
    const user = await User.create({
      name: 'John Doe',
      email: 'user@hotel.com',
      password: 'user123',
      phone: '9666666666',
      role: 'user'
    });
    console.log('✓ User created:', user.email);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Test Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Super Admin: superadmin@hotel.com / superadmin123');
    console.log('Admin:       admin@hotel.com / admin123');
    console.log('Staff:       staff@hotel.com / staff123');
    console.log('User:        user@hotel.com / user123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
