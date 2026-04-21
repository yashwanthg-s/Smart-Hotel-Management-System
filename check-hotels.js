require('dotenv').config();
const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');

async function checkHotels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hotels = await Hotel.find();
    console.log('\n📋 Total Hotels:', hotels.length);
    
    if (hotels.length === 0) {
      console.log('❌ No hotels found in database');
    } else {
      console.log('\n✅ Hotels in database:');
      hotels.forEach((hotel, index) => {
        console.log(`\n${index + 1}. ${hotel.name}`);
        console.log(`   - ID: ${hotel._id}`);
        console.log(`   - Active: ${hotel.isActive}`);
        console.log(`   - Address: ${hotel.address}`);
        console.log(`   - Admin ID: ${hotel.adminId}`);
      });
    }

    // Check active hotels
    const activeHotels = await Hotel.find({ isActive: true });
    console.log('\n\n🟢 Active Hotels:', activeHotels.length);
    activeHotels.forEach(hotel => {
      console.log(`   - ${hotel.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkHotels();
