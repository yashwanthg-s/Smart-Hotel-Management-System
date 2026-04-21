# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/smart-hotel-management
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod
```

### 4. Run the Application
```bash
npm start
```

Visit `http://localhost:3000`

## Default Test Accounts

### Super Admin
- Email: `superadmin@hotel.com`
- Password: `admin123`

### Admin
- Email: `admin@hotel.com`
- Password: `admin123`

### Staff
- Email: `staff@hotel.com`
- Password: `staff123`

### User
- Email: `user@hotel.com`
- Password: `user123`

## First Steps

1. **Register a new account** or login with test credentials
2. **Super Admin**: Create a hotel and assign an admin
3. **Admin**: Add menu items and rooms
4. **Staff**: View and manage orders
5. **User**: Browse hotels, order food, and book rooms

## Key Features to Try

### Food Ordering
1. Go to Hotels tab
2. Click "Order Food"
3. Add items to cart
4. Place order
5. Get QR code

### Room Booking
1. Go to Rooms tab
2. Select hotel and dates
3. Choose a room
4. Complete booking

### Order Management (Staff)
1. Login as staff
2. View pending orders
3. Update order status
4. Scan QR codes

### Admin Dashboard
1. Login as admin
2. View analytics
3. Manage menu items
4. Manage rooms

## Troubleshooting

### Port 3000 already in use?
```bash
# Change port in .env
PORT=3001
```

### MongoDB connection error?
- Ensure MongoDB is running
- Check connection string in .env

### File upload not working?
- Create `public/uploads` directory
- Check file permissions

## Next Steps

- Customize the UI with your branding
- Add payment gateway integration
- Set up email notifications
- Deploy to production

For detailed documentation, see README.md
