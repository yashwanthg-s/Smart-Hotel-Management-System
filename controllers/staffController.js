const User = require('../models/User');
const Hotel = require('../models/Hotel');

// Admin: Get all staff
exports.getStaff = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const staff = await User.find({ hotelId, role: 'staff' });
    res.render('admin/staff', { staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).render('error', { message: 'Failed to fetch staff' });
  }
};

// Admin: Create staff
exports.createStaff = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const { name, email, password, phone, department } = req.body;

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render('admin/staff', {
        staff: await User.find({ hotelId, role: 'staff' }),
        error: 'Email already exists'
      });
    }

    // Create staff user
    const staff = new User({
      name,
      email,
      password,
      phone,
      role: 'staff',
      hotelId,
      department
    });

    await staff.save();

    // Add to hotel's staff array
    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { staff: staff._id }
    });

    res.redirect('/admin/staff');
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).render('error', { message: 'Failed to create staff' });
  }
};

// Admin: Edit staff
exports.editStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, department, password } = req.body;

    const staff = await User.findById(id);
    if (!staff) return res.status(404).render('error', { message: 'Staff not found' });

    staff.name = name;
    staff.phone = phone;
    staff.department = department;

    // Only update password if provided (pre-save hook will hash it)
    if (password && password.trim().length >= 6) {
      staff.password = password;
    }

    await staff.save();
    res.redirect('/admin/staff');
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).render('error', { message: 'Failed to update staff' });
  }
};

// Admin: Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelId = req.session.user.hotelId;

    await User.findByIdAndDelete(id);

    // Remove from hotel's staff array
    await Hotel.findByIdAndUpdate(hotelId, {
      $pull: { staff: id }
    });

    res.redirect('/admin/staff');
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).render('error', { message: 'Failed to delete staff' });
  }
};
