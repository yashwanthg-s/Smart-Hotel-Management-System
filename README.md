# Smart Hotel Management System

A comprehensive full-stack web application for managing hotels with integrated food ordering, room booking, and real-time order tracking.

## Features

### Core Features
- **User Authentication & Authorization**
  - Role-based access control (Super Admin, Admin, Staff, User)
  - Secure login/register system
  - Session management

- **Food Ordering System**
  - Browse menu items with demand indicators
  - Real-time stock management
  - QR code generation for orders
  - Order status tracking (pending → received → preparing → ready → completed)
  - Estimated prep time calculation

- **Room Booking System**
  - Browse available rooms with image sliders
  - Check-in/check-out date selection
  - Multiple images per room
  - Booking confirmation and payment

- **Admin Dashboard**
  - Manage menu items (add/edit/delete)
  - Stock management with auto-disable
  - Room management with multiple images
  - Analytics and charts
  - Staff management

- **Staff Dashboard**
  - Kanban board for order management
  - QR code verification
  - Real-time order status updates

- **User Dashboard**
  - Bottom navigation (Hotels | Rooms | Orders | Profile)
  - Hotel browsing with demand indicators
  - Food ordering with cart
  - Room booking
  - Order tracking

- **Super Admin Dashboard**
  - Add/edit/delete hotels
  - Assign admins to hotels
  - Enable/disable modules
  - Hotel location management

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: EJS templates with Bootstrap 5
- **Authentication**: JWT + Session-based
- **File Upload**: Multer
- **QR Code**: qrcode library
- **Charts**: Chart.js
- **Styling**: Bootstrap 5 + Custom CSS

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-hotel-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/smart-hotel-management
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret_key
   NODE_ENV=development
   ```

4. **Create uploads directory**
   ```bash
   mkdir -p public/uploads
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
smart-hotel-management/
├── models/              # Database schemas
│   ├── User.js
│   ├── Hotel.js
│   ├── MenuItem.js
│   ├── Order.js
│   ├── Room.js
│   └── RoomBooking.js
├── controllers/         # Business logic
│   ├── authController.js
│   ├── hotelController.js
│   ├── menuController.js
│   ├── orderController.js
│   └── roomController.js
├── routes/             # API routes
│   ├── auth.js
│   ├── hotel.js
│   ├── menu.js
│   ├── order.js
│   └── room.js
├── middleware/         # Custom middleware
│   └── auth.js
├── views/              # EJS templates
│   ├── auth/
│   ├── admin/
│   ├── staff/
│   ├── superadmin/
│   └── user/
├── public/             # Static files
│   ├── css/
│   ├── js/
│   └── uploads/
├── server.js           # Main application file
├── package.json
└── README.md
```

## User Roles & Permissions

### Super Admin
- Full system control
- Add/edit/delete hotels
- Assign admins to hotels
- Enable/disable modules
- View system analytics

### Admin (Hotel Owner)
- Manage menu items
- Manage rooms
- Manage staff
- View hotel analytics
- Track orders

### Staff
- View pending orders
- Update order status
- Verify QR codes
- Manage order fulfillment

### User (Customer)
- Browse hotels
- Order food
- Book rooms
- Track orders
- View profile

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /logout` - Logout user

### Hotels
- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/:id` - Get hotel details
- `GET /superadmin/hotels` - Super admin: Get all hotels
- `POST /superadmin/hotels` - Super admin: Create hotel
- `POST /superadmin/hotels/:id` - Super admin: Edit hotel
- `DELETE /superadmin/hotels/:id` - Super admin: Delete hotel

### Menu Items
- `GET /api/hotels/:hotelId/menu` - Get hotel menu
- `GET /admin/menu` - Admin: Get menu items
- `POST /admin/menu` - Admin: Create menu item
- `POST /admin/menu/:id` - Admin: Edit menu item
- `DELETE /admin/menu/:id` - Admin: Delete menu item
- `PUT /admin/menu/:id/stock` - Admin: Update stock

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /staff/orders` - Staff: Get pending orders
- `PUT /staff/orders/:id/status` - Staff: Update order status
- `POST /staff/orders/verify-qr` - Staff: Verify QR code

### Rooms
- `GET /api/hotels/:hotelId/rooms` - Get available rooms
- `GET /api/rooms/:id` - Get room details
- `GET /admin/rooms` - Admin: Get all rooms
- `POST /admin/rooms` - Admin: Create room
- `POST /admin/rooms/:id` - Admin: Edit room
- `DELETE /admin/rooms/:id` - Admin: Delete room
- `POST /api/bookings` - Create room booking
- `GET /api/bookings` - Get user bookings

## Features in Detail

### Demand Indicators
- **Low**: 🟢 (0-5 active orders)
- **Medium**: 🟡 (6-10 active orders)
- **High**: 🔴 (11+ active orders)

### Order Status Flow
1. **Pending** - Order placed, awaiting staff confirmation
2. **Received** - Staff acknowledged the order
3. **Preparing** - Kitchen is preparing the order
4. **Ready** - Order is ready for pickup
5. **Completed** - Order delivered to customer

### Stock Management
- Automatic disable when stock reaches 0
- Automatic enable when stock is replenished
- Real-time stock updates

### QR Code Features
- Generated for each order
- Scanned by staff for verification
- Contains order ID and details

### Analytics
- Orders per day
- Top selling items
- Revenue tracking
- Staff performance

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Session-based authentication
- Role-based access control
- Input validation
- CORS protection

## Future Enhancements

- Payment gateway integration
- Real-time notifications with WebSockets
- Advanced analytics and reporting
- Mobile app
- Multi-language support
- Email notifications
- SMS alerts
- Inventory management
- Delivery tracking

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify database credentials

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### File Upload Issues
- Ensure `public/uploads` directory exists
- Check file permissions
- Verify multer configuration

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.

## Contributing

Contributions are welcome! Please follow the existing code style and create pull requests for any improvements.
"# Smart-Hotel-Management-System" 
