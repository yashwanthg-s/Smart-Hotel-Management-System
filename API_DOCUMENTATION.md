# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require authentication via JWT token or session. Include token in header:
```
Authorization: Bearer <token>
```

## Response Format
All responses are in JSON format:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Authentication Endpoints

### Register User
**POST** `/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "9876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

### Login User
**POST** `/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Logout User
**GET** `/logout`

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Hotel Endpoints

### Get All Hotels (Public)
**GET** `/api/hotels`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "hotel_id",
      "name": "Grand Hotel",
      "description": "Luxury hotel",
      "address": "123 Main St",
      "latitude": 28.7041,
      "longitude": 77.1025,
      "phone": "9876543210",
      "email": "hotel@example.com",
      "modules": {
        "foodSystem": true,
        "roomBooking": true
      }
    }
  ]
}
```

### Get Hotel Details
**GET** `/api/hotels/:id`

Response:
```json
{
  "success": true,
  "data": {
    "_id": "hotel_id",
    "name": "Grand Hotel",
    "description": "Luxury hotel",
    "address": "123 Main St",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "phone": "9876543210",
    "email": "hotel@example.com",
    "modules": {
      "foodSystem": true,
      "roomBooking": true
    }
  }
}
```

### Get All Hotels (Super Admin)
**GET** `/superadmin/hotels`

Requires: Super Admin role

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "hotel_id",
      "name": "Grand Hotel",
      "adminId": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "staff": [],
      "modules": {
        "foodSystem": true,
        "roomBooking": true
      },
      "isActive": true
    }
  ]
}
```

### Create Hotel (Super Admin)
**POST** `/superadmin/hotels`

Requires: Super Admin role

Request:
```json
{
  "name": "Grand Hotel",
  "description": "Luxury hotel",
  "address": "123 Main St",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "phone": "9876543210",
  "email": "hotel@example.com",
  "adminId": "admin_user_id"
}
```

Response:
```json
{
  "success": true,
  "message": "Hotel created successfully"
}
```

### Edit Hotel (Super Admin)
**POST** `/superadmin/hotels/:id`

Requires: Super Admin role

Request:
```json
{
  "name": "Grand Hotel Updated",
  "description": "Updated description",
  "address": "456 New St",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "phone": "9876543210",
  "email": "hotel@example.com"
}
```

### Delete Hotel (Super Admin)
**DELETE** `/superadmin/hotels/:id`

Requires: Super Admin role

### Toggle Module (Super Admin)
**POST** `/superadmin/hotels/:id/toggle-module`

Requires: Super Admin role

Request:
```json
{
  "module": "foodSystem"
}
```

Response:
```json
{
  "success": true,
  "modules": {
    "foodSystem": false,
    "roomBooking": true
  }
}
```

---

## Menu Item Endpoints

### Get Hotel Menu (Public)
**GET** `/api/hotels/:hotelId/menu`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "item_id",
      "name": "Biryani",
      "description": "Fragrant rice dish",
      "price": 250,
      "category": "main",
      "prepTime": 20,
      "image": "/uploads/biryani.jpg",
      "stock": 50,
      "isAvailable": true,
      "activeOrders": 5,
      "demandLevel": "medium"
    }
  ]
}
```

### Get Menu Items (Admin)
**GET** `/admin/menu`

Requires: Admin role

### Create Menu Item (Admin)
**POST** `/admin/menu`

Requires: Admin role, multipart/form-data

Request:
```
name: "Biryani"
description: "Fragrant rice dish"
price: 250
category: "main"
prepTime: 20
stock: 50
maxStock: 100
image: <file>
```

### Edit Menu Item (Admin)
**POST** `/admin/menu/:id`

Requires: Admin role, multipart/form-data

### Delete Menu Item (Admin)
**DELETE** `/admin/menu/:id`

Requires: Admin role

### Update Stock (Admin)
**PUT** `/admin/menu/:id/stock`

Requires: Admin role

Request:
```json
{
  "stock": 75
}
```

Response:
```json
{
  "success": true,
  "item": {
    "_id": "item_id",
    "name": "Biryani",
    "stock": 75,
    "isAvailable": true
  }
}
```

---

## Order Endpoints

### Create Order (User)
**POST** `/api/orders`

Requires: User role

Request:
```json
{
  "hotelId": "hotel_id",
  "items": [
    {
      "menuItemId": "item_id",
      "name": "Biryani",
      "price": 250,
      "quantity": 2,
      "prepTime": 20
    }
  ],
  "totalPrice": 500,
  "roomNumber": "101",
  "notes": "Extra spicy"
}
```

Response:
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "orderId": "ORD-1234567890-ABC",
    "status": "pending",
    "totalPrice": 500,
    "estimatedPrepTime": 20,
    "qrCode": "data:image/png;base64,..."
  }
}
```

### Get User Orders (User)
**GET** `/api/orders`

Requires: User role

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "orderId": "ORD-1234567890-ABC",
      "hotelId": {
        "_id": "hotel_id",
        "name": "Grand Hotel"
      },
      "items": [],
      "totalPrice": 500,
      "status": "preparing",
      "estimatedPrepTime": 20,
      "createdAt": "2024-04-17T10:00:00Z"
    }
  ]
}
```

### Get Order Details (User)
**GET** `/api/orders/:id`

Requires: User role

### Get Pending Orders (Staff)
**GET** `/staff/orders`

Requires: Staff role

### Update Order Status (Staff)
**PUT** `/staff/orders/:id/status`

Requires: Staff role

Request:
```json
{
  "status": "preparing"
}
```

Valid statuses: `received`, `preparing`, `ready`, `completed`, `cancelled`

Response:
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "status": "preparing"
  }
}
```

### Verify QR Code (Staff)
**POST** `/staff/orders/verify-qr`

Requires: Staff role

Request:
```json
{
  "orderId": "ORD-1234567890-ABC"
}
```

Response:
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "orderId": "ORD-1234567890-ABC",
    "status": "ready",
    "items": []
  }
}
```

---

## Room Endpoints

### Get Available Rooms (Public)
**GET** `/api/hotels/:hotelId/rooms?checkInDate=2024-04-20&checkOutDate=2024-04-22`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "room_id",
      "roomNumber": "101",
      "roomType": "double",
      "price": 5000,
      "capacity": 2,
      "description": "Spacious double room",
      "images": ["/uploads/room1.jpg", "/uploads/room2.jpg"],
      "amenities": ["WiFi", "AC", "TV"],
      "isAvailable": true
    }
  ]
}
```

### Get Room Details
**GET** `/api/rooms/:id`

Response:
```json
{
  "success": true,
  "data": {
    "_id": "room_id",
    "roomNumber": "101",
    "roomType": "double",
    "price": 5000,
    "capacity": 2,
    "description": "Spacious double room",
    "images": ["/uploads/room1.jpg"],
    "amenities": ["WiFi", "AC", "TV"]
  }
}
```

### Get Rooms (Admin)
**GET** `/admin/rooms`

Requires: Admin role

### Create Room (Admin)
**POST** `/admin/rooms`

Requires: Admin role, multipart/form-data

Request:
```
roomNumber: "101"
roomType: "double"
price: 5000
capacity: 2
description: "Spacious double room"
amenities: "WiFi, AC, TV"
images: <files>
```

### Edit Room (Admin)
**POST** `/admin/rooms/:id`

Requires: Admin role, multipart/form-data

### Delete Room (Admin)
**DELETE** `/admin/rooms/:id`

Requires: Admin role

---

## Room Booking Endpoints

### Create Room Booking (User)
**POST** `/api/bookings`

Requires: User role

Request:
```json
{
  "hotelId": "hotel_id",
  "roomId": "room_id",
  "checkInDate": "2024-04-20",
  "checkOutDate": "2024-04-22",
  "guestName": "John Doe",
  "guestPhone": "9876543210",
  "guestEmail": "john@example.com",
  "numberOfGuests": 2,
  "specialRequests": "Late checkout"
}
```

Response:
```json
{
  "success": true,
  "booking": {
    "_id": "booking_id",
    "roomId": "room_id",
    "checkInDate": "2024-04-20",
    "checkOutDate": "2024-04-22",
    "numberOfNights": 2,
    "totalPrice": 10000,
    "status": "pending"
  }
}
```

### Get User Bookings (User)
**GET** `/api/bookings`

Requires: User role

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_id",
      "hotelId": {
        "_id": "hotel_id",
        "name": "Grand Hotel"
      },
      "roomId": {
        "_id": "room_id",
        "roomNumber": "101",
        "roomType": "double",
        "price": 5000
      },
      "checkInDate": "2024-04-20",
      "checkOutDate": "2024-04-22",
      "numberOfNights": 2,
      "totalPrice": 10000,
      "status": "confirmed"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Applied to: `/api/*` endpoints

---

## Pagination

For list endpoints, use query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Example:
```
GET /api/orders?page=2&limit=20
```

---

## Sorting

For list endpoints, use query parameters:
- `sort`: Field to sort by
- `order`: `asc` or `desc`

Example:
```
GET /api/hotels?sort=name&order=asc
```

---

## Filtering

For list endpoints, use query parameters:
- `status`: Filter by status
- `category`: Filter by category
- `hotelId`: Filter by hotel

Example:
```
GET /api/orders?status=pending&hotelId=hotel_id
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Hotels
```bash
curl -X GET http://localhost:3000/api/hotels
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "hotelId": "hotel_id",
    "items": [...],
    "totalPrice": 500
  }'
```

---

## Webhooks (Future)

Webhooks for:
- Order status changes
- Room booking confirmations
- Payment updates
- Inventory alerts

---

## Rate Limits

- Authentication endpoints: 5 requests per minute
- API endpoints: 100 requests per 15 minutes
- File upload: 10MB max per file

---

## Versioning

Current API Version: v1
Future versions will be available at `/api/v2/`

---

## Support

For API issues:
1. Check error response message
2. Verify authentication token
3. Check request format
4. Review logs
5. Contact support

---

**Last Updated**: April 2026
**API Version**: 1.0.0
