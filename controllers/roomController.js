const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');

// Admin: Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;

    // Check if room booking module is enabled
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.modules.roomBooking) {
      return res.status(403).render('error', {
        message: 'Room Booking module is disabled for this hotel. Contact Super Admin to enable it.'
      });
    }

    const rooms = await Room.find({ hotelId });
    res.render('admin/rooms', { rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).render('error', { message: 'Failed to fetch rooms' });
  }
};

// Admin: Create room
exports.createRoom = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const { roomNumber, roomType, price, capacity, description, amenities } = req.body;

    // Handle multiple image uploads
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const room = new Room({
      hotelId,
      roomNumber,
      roomType,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      description,
      images,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : []
    });

    await room.save();
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).render('error', { message: 'Failed to create room' });
  }
};

// Admin: Edit room
exports.editRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, roomType, price, capacity, description, amenities } = req.body;

    const updateData = {
      roomNumber,
      roomType,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      description,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : []
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    await Room.findByIdAndUpdate(id, updateData);
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).render('error', { message: 'Failed to update room' });
  }
};

// Admin: Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await Room.findByIdAndDelete(id);
    res.redirect('/admin/rooms');
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).render('error', { message: 'Failed to delete room' });
  }
};

// User: Get available rooms for hotel
exports.getAvailableRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    const rooms = await Room.find({ hotelId, isAvailable: true });

    // Find booked rooms for the date range
    const bookedRooms = await RoomBooking.find({
      roomId: { $in: rooms.map(r => r._id) },
      status: { $in: ['confirmed', 'checked-in', 'pending'] },
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) }
        }
      ]
    });

    const bookedRoomIds = new Set(bookedRooms.map(b => b.roomId.toString()));

    // Return all rooms with isBooked flag
    const roomsWithStatus = rooms.map(r => ({
      ...r.toObject(),
      isBooked: bookedRoomIds.has(r._id.toString())
    }));

    res.json(roomsWithStatus);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ error: 'Failed to fetch available rooms' });
  }
};

// User: Create room booking
exports.createRoomBooking = async (req, res) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, guestName, guestPhone, guestEmail, numberOfGuests, specialRequests } = req.body;
    const userId = req.session.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * numberOfNights;

    const booking = new RoomBooking({
      hotelId,
      roomId,
      userId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      totalPrice,
      guestName,
      guestPhone,
      guestEmail,
      numberOfGuests: parseInt(numberOfGuests),
      specialRequests,
      status: 'pending'
    });

    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error creating room booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// User: Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.session.userId;
    const bookings = await RoomBooking.find({ userId })
      .populate('hotelId', 'name')
      .populate('roomId', 'roomNumber roomType price')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Get room details
exports.getRoomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};
