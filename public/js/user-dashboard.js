// User Dashboard JavaScript

let cart = [];
let selectedHotel = null;

// Load hotels on page load
document.addEventListener('DOMContentLoaded', function() {
  loadHotels();
  loadOrders();
  loadRoomBookings();
  loadHotelsForBooking();
});

// Load all hotels with ETA and search support
async function loadHotels() {
  const hotelsList = document.getElementById('hotelsList');
  if (!hotelsList) return;
  hotelsList.innerHTML = '<div class="col-12 text-center text-secondary py-4"><i class="fas fa-spinner fa-spin me-2"></i>Loading hotels...</div>';

  try {
    const res = await fetch('/api/hotels');
    if (!res.ok) throw new Error('Failed to fetch');
    const hotels = await res.json();
    hotelsList.innerHTML = '';

    if (!hotels || hotels.length === 0) {
      hotelsList.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="fas fa-hotel fa-3x mb-3 d-block opacity-25"></i>No hotels available</div>';
      return;
    }

    // Store all hotels for search
    window._allHotels = hotels;

    const locationGranted = await ETAModule.init();
    renderHotelCards(hotels, locationGranted);

  } catch (error) {
    console.error('Error loading hotels:', error);
    hotelsList.innerHTML = '<div class="col-12 text-center text-danger py-4">Error loading hotels. Please refresh.</div>';
  }
}

function renderHotelCards(hotels, locationGranted) {
  const hotelsList = document.getElementById('hotelsList');
  hotelsList.innerHTML = '';

  if (hotels.length === 0) {
    hotelsList.innerHTML = '<div class="col-12 text-center text-muted py-4">No hotels match your search</div>';
    return;
  }

  hotels.forEach(hotel => {
    const hotelCard = document.createElement('div');
    hotelCard.className = 'col-md-6 col-lg-4 mb-4 hotel-card-col';
    hotelCard.dataset.name = hotel.name.toLowerCase();
    hotelCard.dataset.address = (hotel.address || '').toLowerCase();
    hotelCard.id = `hotel-card-${hotel._id}`;

    hotelCard.innerHTML = `
      <div class="card h-100 shadow-sm" style="border-radius:14px;overflow:hidden;transition:transform 0.2s;"
        onmouseover="this.style.transform='translateY(-4px)'"
        onmouseout="this.style.transform='translateY(0)'">
        <div class="card-body p-4">
          <h5 class="card-title fw-bold mb-1">${hotel.name}</h5>
          <p class="text-muted small mb-2"><i class="fas fa-map-marker-alt me-1"></i>${hotel.address || ''}</p>
          ${hotel.description ? `<p class="text-muted small mb-2">${hotel.description}</p>` : ''}
          <div id="eta-${hotel._id}" class="mb-3" style="font-size:0.82rem;color:#94a3b8;">
            ${locationGranted ? '<i class="fas fa-spinner fa-spin me-1"></i> Calculating distance...' : '<i class="fas fa-location-slash me-1"></i> Enable location for ETA'}
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm flex-grow-1" onclick="window.location.href='/user/order-food/${hotel._id}'">
              <i class="fas fa-utensils me-1"></i> Order Food
            </button>
            <button class="btn btn-info btn-sm px-3" onclick="viewMap('${hotel.latitude}','${hotel.longitude}')" title="View on Map">
              <i class="fas fa-map-marker-alt"></i>
            </button>
          </div>
        </div>
      </div>`;
    hotelsList.appendChild(hotelCard);

    // Load ETA
    if (locationGranted && hotel.latitude && hotel.longitude) {
      ETAModule.fetchETA(hotel.latitude, hotel.longitude).then(etaData => {
        const etaEl = document.getElementById(`eta-${hotel._id}`);
        if (etaEl && etaData) {
          etaEl.innerHTML = `<i class="fas fa-map-marker-alt text-info me-1"></i>${etaData.distance} km &nbsp; <i class="fas fa-car text-info me-1"></i>${etaData.eta} min away`;
        } else if (etaEl) {
          etaEl.innerHTML = '';
        }
      });
    }
  });
}

// Filter hotels by search — fuzzy match
function filterHotels(query) {
  const q = query.toLowerCase().trim();
  if (!window._allHotels) return;

  if (!q) {
    renderHotelCards(window._allHotels, false);
    return;
  }

  const filtered = window._allHotels.filter(hotel => {
    const name = hotel.name.toLowerCase();
    const addr = (hotel.address || '').toLowerCase();
    // Fuzzy: check if all typed chars appear in order
    return name.includes(q) || addr.includes(q) ||
      q.split('').every(c => name.includes(c));
  });

  renderHotelCards(filtered, false);
}

// Load hotels for room booking (only hotels with room booking enabled)
async function loadHotelsForBooking() {
  try {
    const res = await fetch('/api/hotels-rooms');
    const hotels = await res.json();
    window._allRoomHotels = hotels;
    renderRoomHotelCards(hotels);
  } catch (error) {
    console.error('Error loading hotels for booking:', error);
  }
}

function renderRoomHotelCards(hotels) {
  const list = document.getElementById('roomHotelsList');
  if (!list) return;
  list.innerHTML = '';

  if (!hotels || hotels.length === 0) {
    list.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="fas fa-bed fa-3x mb-3 d-block opacity-25"></i>No hotels with room booking available</div>';
    return;
  }

  hotels.forEach(hotel => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4 room-hotel-col';
    col.dataset.name = hotel.name.toLowerCase();
    col.dataset.address = (hotel.address || '').toLowerCase();

    col.innerHTML = `
      <div class="card h-100 shadow-sm" style="border-radius:14px;overflow:hidden;transition:transform 0.2s;"
        onmouseover="this.style.transform='translateY(-4px)'"
        onmouseout="this.style.transform='translateY(0)'">
        <div class="card-body p-4">
          <h5 class="card-title fw-bold mb-1">${hotel.name}</h5>
          <p class="text-muted small mb-3"><i class="fas fa-map-marker-alt me-1"></i>${hotel.address || ''}</p>
          <div id="room-hotel-eta-${hotel._id}" class="mb-3" style="font-size:0.82rem;color:#94a3b8;">
            <i class="fas fa-spinner fa-spin me-1"></i> Calculating distance...
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm flex-grow-1"
              onclick="window.location.href='/user/book-rooms/${hotel._id}'">
              <i class="fas fa-bed me-1"></i> Book
            </button>
            <button class="btn btn-info btn-sm px-3"
              onclick="viewMap('${hotel.latitude}','${hotel.longitude}')" title="View on Map">
              <i class="fas fa-map-marker-alt"></i>
            </button>
          </div>
        </div>
      </div>`;
    list.appendChild(col);

    // Load ETA
    ETAModule.init().then(granted => {
      if (granted && hotel.latitude && hotel.longitude) {
        ETAModule.fetchETA(hotel.latitude, hotel.longitude).then(etaData => {
          const el = document.getElementById(`room-hotel-eta-${hotel._id}`);
          if (el && etaData) {
            el.innerHTML = `<i class="fas fa-map-marker-alt text-info me-1"></i>${etaData.distance} km &nbsp; <i class="fas fa-car text-info me-1"></i>${etaData.eta} min away`;
          } else if (el) el.innerHTML = '';
        });
      } else {
        const el = document.getElementById(`room-hotel-eta-${hotel._id}`);
        if (el) el.innerHTML = '<i class="fas fa-location-slash me-1"></i> Enable location for ETA';
      }
    });
  });
}

function filterRoomHotels(query) {
  const q = query.toLowerCase().trim();
  if (!window._allRoomHotels) return;
  const filtered = !q ? window._allRoomHotels :
    window._allRoomHotels.filter(h =>
      h.name.toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q) ||
      q.split('').every(c => h.name.toLowerCase().includes(c))
    );
  renderRoomHotelCards(filtered);
}

// Order food
async function orderFood(hotelId) {
  selectedHotel = hotelId;
  cart = [];
  
  try {
    const menu = await fetchAPI(`/api/hotels/${hotelId}/menu`);
    const menuItems = document.getElementById('menuItems');
    menuItems.innerHTML = '';

    menu.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'card mb-2';
      itemDiv.innerHTML = `
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <h6>${item.name}</h6>
              <p class="small text-muted">${item.description || ''}</p>
              <p class="small">
                <strong>₹${item.price}</strong> | 
                <i class="fas fa-clock"></i> ${item.prepTime} min |
                ${getDemandBadge(item.demandLevel)}
              </p>
            </div>
            <div class="col-md-4">
              <div class="input-group input-group-sm">
                <button class="btn btn-outline-secondary" onclick="decreaseQty('${item._id}')">-</button>
                <input type="number" class="form-control text-center" id="qty-${item._id}" value="0" readonly>
                <button class="btn btn-outline-secondary" onclick="increaseQty('${item._id}', '${item.name}', ${item.price}, ${item.prepTime})">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
      menuItems.appendChild(itemDiv);
    });

    const modal = new bootstrap.Modal(document.getElementById('foodOrderModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading menu:', error);
  }
}

// Increase quantity
function increaseQty(itemId, name, price, prepTime) {
  const input = document.getElementById(`qty-${itemId}`);
  let qty = parseInt(input.value) || 0;
  qty++;
  input.value = qty;

  // Add to cart
  const existingItem = cart.find(item => item.menuItemId === itemId);
  if (existingItem) {
    existingItem.quantity = qty;
  } else {
    cart.push({
      menuItemId: itemId,
      name,
      price,
      quantity: qty,
      prepTime
    });
  }

  updateCartDisplay();
}

// Decrease quantity
function decreaseQty(itemId) {
  const input = document.getElementById(`qty-${itemId}`);
  let qty = parseInt(input.value) || 0;
  if (qty > 0) {
    qty--;
    input.value = qty;

    if (qty === 0) {
      cart = cart.filter(item => item.menuItemId !== itemId);
    } else {
      const item = cart.find(i => i.menuItemId === itemId);
      if (item) item.quantity = qty;
    }

    updateCartDisplay();
  }
}

// Update cart display
function updateCartDisplay() {
  const cartItems = document.getElementById('cartItems');
  const totalPrice = document.getElementById('totalPrice');
  const prepTime = document.getElementById('prepTime');

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-muted">Cart is empty</p>';
    totalPrice.textContent = '0';
    prepTime.textContent = '0';
    return;
  }

  let html = '<ul class="list-group">';
  let total = 0;
  let maxPrepTime = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    maxPrepTime = Math.max(maxPrepTime, item.prepTime);

    html += `
      <li class="list-group-item d-flex justify-content-between">
        <span>${item.name} x${item.quantity}</span>
        <span>₹${itemTotal}</span>
      </li>
    `;
  });

  html += '</ul>';
  cartItems.innerHTML = html;
  totalPrice.textContent = total;
  prepTime.textContent = maxPrepTime;
}

// Place order
async function placeOrder() {
  if (cart.length === 0) {
    showAlert('Cart is empty', 'warning');
    return;
  }

  try {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const maxPrepTime = Math.max(...cart.map(item => item.prepTime));

    const order = await fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        hotelId: selectedHotel,
        items: cart,
        totalPrice,
        estimatedPrepTime: maxPrepTime,
        roomNumber: '',
        notes: ''
      })
    });

    showAlert('Order placed successfully!', 'success');
    
    // Show QR code
    if (order.qrCode) {
      const qrModal = document.createElement('div');
      qrModal.className = 'modal fade';
      qrModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Order Confirmation</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <p><strong>Order ID:</strong> ${order.order.orderId}</p>
              <img src="${order.qrCode}" alt="QR Code" class="img-fluid" style="max-width: 200px;">
              <p class="mt-3">Est. Prep Time: ${order.order.estimatedPrepTime} minutes</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(qrModal);
      const modal = new bootstrap.Modal(qrModal);
      modal.show();
    }

    cart = [];
    loadOrders();
  } catch (error) {
    console.error('Error placing order:', error);
  }
}

// Load user room bookings
async function loadRoomBookings() {
  const list = document.getElementById('roomBookingsList');
  if (!list) return;
  try {
    const res = await fetch('/api/my-bookings');
    const bookings = await res.json();

    if (!bookings || bookings.length === 0) {
      list.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-bed fa-2x mb-2 d-block opacity-25"></i>No room bookings yet</div>';
      return;
    }

    const statusColors = { pending:'warning', confirmed:'info', 'checked-in':'success', 'checked-out':'secondary', cancelled:'danger' };

    list.innerHTML = bookings.map(b => `
      <div class="card mb-3 shadow-sm" style="border-radius:12px;overflow:hidden;">
        <div class="card-body p-3">
          <div class="row align-items-center">
            <div class="col-md-8">
              <div class="d-flex align-items-center gap-3 mb-2">
                <i class="fas fa-bed text-info fa-lg"></i>
                <div>
                  <h6 class="fw-bold mb-0">${b.roomId?.roomNumber || 'Room'} — ${b.roomId?.roomType || ''}</h6>
                  <small class="text-muted">${b.hotelId?.name || 'Hotel'}</small>
                </div>
              </div>
              <p class="small mb-1">
                <i class="fas fa-calendar-check text-success me-1"></i>
                <strong>Check-in:</strong> ${new Date(b.checkInDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                &nbsp;&nbsp;
                <i class="fas fa-calendar-times text-danger me-1"></i>
                <strong>Check-out:</strong> ${new Date(b.checkOutDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
              </p>
              <p class="small mb-0">
                <strong>Nights:</strong> ${b.numberOfNights} &nbsp;
                <strong>Total:</strong> <span class="text-success fw-bold">₹${b.totalPrice}</span>
              </p>
            </div>
            <div class="col-md-4 text-end">
              <span class="badge bg-${statusColors[b.status] || 'secondary'} mb-2 d-block" style="border-radius:20px;padding:6px 14px;">
                ${b.status.replace('-',' ').toUpperCase()}
              </span>
              <small class="text-muted">${new Date(b.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small>
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch (e) {
    console.error('Error loading room bookings:', e);
  }
}

// Load user orders
async function loadOrders() {
  try {
    const orders = await fetchAPI('/api/orders');
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    if (orders.length === 0) {
      ordersList.innerHTML = '<p class="text-muted">No orders yet</p>';
      return;
    }

    // Start ETA tracking for active orders
    const activeOrders = orders.filter(o => ['received','preparing'].includes(o.status));
    if (activeOrders.length > 0) {
      ETAModule.init().then(granted => {
        if (granted) {
          activeOrders.forEach(order => {
            if (order.hotelId && order.hotelId.latitude && order.hotelId.longitude) {
              // Push ETA immediately
              ETAModule.trackOrderETA(order._id, order.hotelId.latitude, order.hotelId.longitude);
              // Then push every 1 minute
              setInterval(() => {
                ETAModule.trackOrderETA(order._id, order.hotelId.latitude, order.hotelId.longitude);
              }, 60 * 1000);
            }
          });
        }
      });
    }

    orders.forEach(order => {
      const statusColors = {
        pending: 'warning', received: 'info', preparing: 'secondary',
        ready: 'success', completed: 'primary', cancelled: 'danger'
      };
      const badgeColor = statusColors[order.status] || 'info';
      const showQR = !['completed', 'cancelled'].includes(order.status);

      // Star rating display
      let ratingHtml = '';
      if (order.status === 'completed') {
        if (order.rating && order.rating.stars) {
          const stars = '★'.repeat(order.rating.stars) + '☆'.repeat(5 - order.rating.stars);
          ratingHtml = `<div class="mt-2 fw-bold" style="color:#fbbf24;font-size:1.1rem;" title="Your rating">${stars}</div>`;
        } else {
          ratingHtml = `<button class="btn btn-sm mt-2 fw-bold" 
            style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:8px;padding:5px 14px;font-size:0.78rem;"
            onclick="openRating('${order._id}', '${order.orderId}')">
            <i class="fas fa-star me-1"></i> Rate Order
          </button>`;
        }
      }

      // Complaint button - only for completed orders within 24 hours
      let complaintHtml = '';
      if (order.status === 'completed') {
        const orderAge = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
        if (orderAge <= 24) {
          complaintHtml = `<button class="btn btn-sm mt-1 fw-bold"
            style="background:rgba(252,129,129,0.15);color:#fc8181;border:1px solid rgba(252,129,129,0.3);border-radius:8px;padding:5px 14px;font-size:0.78rem;"
            onclick="openComplaint('${order._id}', '${order.orderId}', '${order.hotelId?._id || ''}')">
            <i class="fas fa-exclamation-circle me-1"></i> Raise Complaint
          </button>`;
        }
      }

      const orderDiv = document.createElement('div');
      orderDiv.className = 'card mb-3 shadow-sm';
      orderDiv.innerHTML = `
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h6 class="fw-bold">${order.orderId}</h6>
              <p class="small text-muted mb-1">${formatDate(order.createdAt)}</p>
              <p class="small mb-0">
                <strong>Hotel:</strong> ${order.hotelId ? order.hotelId.name : 'N/A'}<br>
                <strong>Items:</strong> ${order.items.length}<br>
                <strong>Total:</strong> ₹${order.totalPrice}
              </p>
              ${ratingHtml}
              ${complaintHtml}
            </div>
            <div class="col-md-4 text-end">
              <span class="badge bg-${badgeColor} mb-2 d-inline-block" style="font-size:0.72rem;padding:5px 12px;border-radius:20px;">${order.status.toUpperCase()}</span>
              <p class="small text-muted">Est: ${order.estimatedPrepTime} min</p>
              ${showQR ? `
                <button class="btn btn-sm mt-2 fw-bold" 
                  style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;padding:6px 14px;font-size:0.82rem;"
                  onclick="showQRCode('${order._id}', '${order.orderId}')">
                  <i class="fas fa-qrcode me-1"></i> Show QR Code
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      ordersList.appendChild(orderDiv);
    });
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Search rooms
async function searchRooms() {
  const hotelId = document.getElementById('hotelSelect').value;
  const checkInDate = document.getElementById('checkInDate').value;
  const checkOutDate = document.getElementById('checkOutDate').value;
  const roomsList = document.getElementById('roomsList');

  if (!hotelId || !checkInDate || !checkOutDate) {
    roomsList.innerHTML = '<p class="text-warning">Please select hotel and dates</p>';
    return;
  }

  roomsList.innerHTML = '<p class="text-secondary"><i class="fas fa-spinner fa-spin me-2"></i>Searching rooms...</p>';

  try {
    const res = await fetch(`/api/hotels/${hotelId}/rooms?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`);
    const rooms = await res.json();
    roomsList.innerHTML = '';

    if (!rooms || rooms.length === 0) {
      roomsList.innerHTML = '<div class="col-12"><p class="text-muted text-center py-4">No rooms available for selected dates</p></div>';
      return;
    }

    // Get hotel location for ETA
    const hotelRes = await fetch(`/api/hotels/${hotelId}`);
    const hotelData = await hotelRes.json();
    const hotelLat = hotelData.latitude;
    const hotelLng = hotelData.longitude;

    const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));

    rooms.forEach(room => {
      const totalPrice = room.price * nights;
      let imagesHtml = '';
      if (room.images && room.images.length > 0) {
        imagesHtml = `
          <div id="carousel-${room._id}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${room.images.map((img, idx) => `
                <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                  <img src="${img}" class="d-block w-100" style="height:200px;object-fit:cover;" alt="Room">
                </div>`).join('')}
            </div>
            ${room.images.length > 1 ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${room._id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carousel-${room._id}" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
              </button>` : ''}
          </div>`;
      } else {
        imagesHtml = `<div class="d-flex align-items-center justify-content-center bg-dark text-white-50" style="height:160px;">
          <i class="fas fa-bed fa-3x"></i></div>`;
      }

      const roomCard = document.createElement('div');
      roomCard.className = 'col-md-6 col-lg-4 mb-4 room-card-col';
      roomCard.dataset.name = (room.roomNumber || '').toLowerCase();
      roomCard.dataset.type = (room.roomType || '').toLowerCase();

      roomCard.innerHTML = `
        <div class="card h-100 shadow-sm" style="border-radius:14px;overflow:hidden;cursor:pointer;transition:transform 0.2s;"
          onmouseover="this.style.transform='translateY(-4px)'"
          onmouseout="this.style.transform='translateY(0)'"
          onclick="openRoomDetail('${room._id}','${hotelId}','${checkInDate}','${checkOutDate}',${totalPrice})">
          ${imagesHtml}
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title fw-bold mb-0">${room.roomNumber}</h5>
              <span class="badge" style="background:rgba(99,179,237,0.2);color:#63b3ed;border-radius:20px;font-size:0.75rem;">${room.roomType}</span>
            </div>
            <p class="card-text text-muted small mb-2">${room.description || 'Comfortable and well-furnished room'}</p>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold text-success fs-5">₹${room.price}<small class="text-muted fs-6">/night</small></span>
              <span class="text-muted small"><i class="fas fa-users me-1"></i>${room.capacity} guests</span>
            </div>
            <div id="room-eta-${room._id}" class="mb-2 small text-secondary">
              <i class="fas fa-spinner fa-spin me-1"></i> Calculating distance...
            </div>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-primary btn-sm flex-grow-1"
                onclick="event.stopPropagation(); openRoomDetail('${room._id}','${hotelId}','${checkInDate}','${checkOutDate}',${totalPrice})">
                <i class="fas fa-bed me-1"></i> Book — ₹${totalPrice}
              </button>
              <button class="btn btn-info btn-sm px-3"
                onclick="event.stopPropagation(); viewMap('${hotelLat}','${hotelLng}')"
                title="View on Map">
                <i class="fas fa-map-marker-alt"></i>
              </button>
            </div>
          </div>
        </div>`;
      roomsList.appendChild(roomCard);

      // Load ETA for this room's hotel
      if (hotelLat && hotelLng) {
        ETAModule.init().then(granted => {
          if (granted) {
            ETAModule.fetchETA(hotelLat, hotelLng).then(etaData => {
              const etaEl = document.getElementById(`room-eta-${room._id}`);
              if (etaEl && etaData) {
                etaEl.innerHTML = `<i class="fas fa-map-marker-alt text-info me-1"></i>${etaData.distance} km &nbsp; <i class="fas fa-car text-info me-1"></i>${etaData.eta} min away`;
              }
            });
          } else {
            const etaEl = document.getElementById(`room-eta-${room._id}`);
            if (etaEl) etaEl.innerHTML = '';
          }
        });
      }
      roomsList.appendChild(roomCard);
    });
  } catch (error) {
    console.error('Error searching rooms:', error);
    roomsList.innerHTML = '<div class="col-12"><p class="text-danger">Error loading rooms. Please try again.</p></div>';
  }
}
// Book room
async function bookRoom(roomId, hotelId, checkInDate, checkOutDate, totalPrice) {
  try {
    const booking = await fetchAPI('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        hotelId,
        roomId,
        checkInDate,
        checkOutDate,
        guestName: 'Guest',
        guestPhone: '',
        guestEmail: '',
        numberOfGuests: 1,
        specialRequests: ''
      })
    });

    showAlert('Room booked successfully!', 'success');
  } catch (error) {
    console.error('Error booking room:', error);
  }
}

// Filter rooms by search
function filterRooms(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.room-card-col').forEach(col => {
    const name = col.dataset.name || '';
    const type = col.dataset.type || '';
    col.style.display = (name.includes(q) || type.includes(q)) ? '' : 'none';
  });
}

// View map
function viewMap(latitude, longitude) {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(mapUrl, '_blank');
}

// Show QR Code for an order
async function showQRCode(orderId, orderIdText) {
  try {
    const order = await fetchAPI(`/api/orders/${orderId}`);

    // Remove existing modal if any
    const existing = document.getElementById('qrCodeModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'qrCodeModal';
    modal.innerHTML = `
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title"><i class="fas fa-qrcode"></i> Order QR Code</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center p-4">
            <p class="fw-bold mb-1">${orderIdText}</p>
            <p class="badge bg-${order.status === 'ready' ? 'success' : 'warning'} mb-3">${order.status.toUpperCase()}</p>
            ${order.qrCode
              ? `<img src="${order.qrCode}" alt="QR Code" class="img-fluid border rounded p-2" style="max-width:200px;">`
              : `<p class="text-muted">QR Code not available</p>`
            }
            <p class="small text-muted mt-3">Show this QR code to staff when collecting your order</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Auto-poll status while modal is open
    const pollInterval = setInterval(async () => {
      try {
        const updated = await fetchAPI(`/api/orders/${orderId}`);
        const badge = modal.querySelector('.badge');
        if (badge) {
          badge.className = `badge bg-${updated.status === 'ready' ? 'success' : updated.status === 'completed' ? 'primary' : 'warning'} mb-3`;
          badge.textContent = updated.status.toUpperCase();
        }
        if (updated.status === 'completed') clearInterval(pollInterval);
      } catch (e) { clearInterval(pollInterval); }
    }, 5000);

    modal.addEventListener('hidden.bs.modal', () => {
      clearInterval(pollInterval);
      modal.remove();
      loadOrders(); // Refresh orders list
    });

  } catch (error) {
    console.error('Error fetching QR code:', error);
  }
}

// Open rating modal
function openRating(orderId, orderIdText) {
  const existing = document.getElementById('ratingModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'ratingModal';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content" style="border-radius:16px; border:none;">
        <div class="modal-header bg-warning" style="border-radius:16px 16px 0 0;">
          <h6 class="modal-title fw-bold mb-0"><i class="fas fa-star"></i> Rate Your Order</h6>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body text-center p-4">
          <p class="small text-muted mb-1">${orderIdText}</p>
          <p class="mb-3">How was your experience?</p>

          <!-- Star Rating -->
          <div class="star-rating mb-3" id="starRating">
            ${[1,2,3,4,5].map(i => `
              <span class="star" data-value="${i}"
                style="font-size:2.2rem; cursor:pointer; color:#ddd; transition:color 0.15s;"
                onmouseover="hoverStars(${i})"
                onmouseout="resetStars()"
                onclick="selectStar(${i})">★</span>
            `).join('')}
          </div>
          <p class="small text-muted mb-3" id="ratingLabel">Click to rate</p>

          <textarea class="form-control form-control-sm mb-3" id="reviewText"
            placeholder="Write a review (optional)" rows="3"></textarea>

          <button class="btn btn-warning w-100 fw-bold" id="submitRatingBtn"
            onclick="submitRating('${orderId}')" disabled>
            <i class="fas fa-paper-plane"></i> Submit Rating
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

let selectedRating = 0;
const ratingLabels = ['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Very Good', '🤩 Excellent!'];

function hoverStars(val) {
  document.querySelectorAll('#starRating .star').forEach((s, i) => {
    s.style.color = i < val ? '#ffc107' : '#ddd';
  });
}

function resetStars() {
  document.querySelectorAll('#starRating .star').forEach((s, i) => {
    s.style.color = i < selectedRating ? '#ffc107' : '#ddd';
  });
}

function selectStar(val) {
  selectedRating = val;
  document.querySelectorAll('#starRating .star').forEach((s, i) => {
    s.style.color = i < val ? '#ffc107' : '#ddd';
  });
  document.getElementById('ratingLabel').textContent = ratingLabels[val];
  document.getElementById('submitRatingBtn').disabled = false;
}

async function submitRating(orderId) {
  if (!selectedRating) return;

  const btn = document.getElementById('submitRatingBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

  try {
    const res = await fetch(`/api/orders/${orderId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stars: selectedRating,
        review: document.getElementById('reviewText').value
      })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('ratingModal').querySelector('.modal-body').innerHTML = `
        <div class="py-3">
          <div style="font-size:3rem;">🎉</div>
          <h5 class="fw-bold mt-2">Thank You!</h5>
          <p class="text-muted">Your feedback helps us improve.</p>
          <div style="font-size:1.8rem; color:#ffc107;">${'★'.repeat(selectedRating)}${'☆'.repeat(5-selectedRating)}</div>
        </div>`;
      selectedRating = 0;
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('ratingModal'))?.hide();
        loadOrders();
      }, 2000);
    } else {
      alert(data.error || 'Failed to submit rating');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Rating';
    }
  } catch (e) {
    alert('Error submitting rating');
    btn.disabled = false;
  }
}

// Open complaint modal for a specific order
function openComplaint(orderId, orderIdText, hotelId) {
  const existing = document.getElementById('complaintModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'complaintModal';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content glass-card overflow-hidden">
        <div class="modal-header bg-dark bg-opacity-50 border-white border-opacity-10 p-4">
          <h5 class="modal-title fw-bold text-white">
            <i class="fas fa-exclamation-circle text-danger me-2"></i> Raise Complaint
          </h5>
          <button type="button" class="btn btn-glass p-2 border-0" data-bs-dismiss="modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body p-4">
          <div id="complaintMsg"></div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-bold">CATEGORY</label>
            <select class="form-select" id="complaintCategory"
              style="background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.15);">
              <option value="food_quality" style="background:#1e293b;color:#e2e8f0;">🍽 Food Quality</option>
              <option value="service" style="background:#1e293b;color:#e2e8f0;">🛎 Service</option>
              <option value="cleanliness" style="background:#1e293b;color:#e2e8f0;">🧹 Cleanliness</option>
              <option value="billing" style="background:#1e293b;color:#e2e8f0;">💳 Billing Issue</option>
              <option value="staff" style="background:#1e293b;color:#e2e8f0;">👤 Staff Behavior</option>
              <option value="other" style="background:#1e293b;color:#e2e8f0;">📝 Other</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-bold">ORDER ID (Subject)</label>
            <input type="text" class="form-control" id="complaintSubject"
              value="${orderIdText}" readonly
              style="background:rgba(255,255,255,0.05);color:#68d391;font-weight:600;">
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-bold">YOUR MESSAGE</label>
            <textarea class="form-control" id="complaintMessage" rows="4"
              placeholder="Describe your issue with this order..."></textarea>
          </div>
        </div>
        <div class="modal-footer bg-dark bg-opacity-50 border-white border-opacity-10 p-4">
          <button type="button" class="btn btn-glass px-4" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-gradient px-4"
            onclick="submitComplaint('${orderId}', '${hotelId}')">
            <i class="fas fa-paper-plane me-2"></i> Submit Complaint
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

async function submitComplaint(orderId, hotelId) {
  const message = document.getElementById('complaintMessage').value.trim();
  const category = document.getElementById('complaintCategory').value;
  const subject = document.getElementById('complaintSubject').value;
  const msgDiv = document.getElementById('complaintMsg');

  if (!message) {
    msgDiv.innerHTML = `<div class="alert glass text-danger border border-danger border-opacity-25 py-2 mb-3 small">
      Please enter your message
    </div>`;
    return;
  }

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message, category, hotelId, orderId })
    });
    const data = await res.json();

    if (data.success) {
      msgDiv.innerHTML = `<div class="alert glass text-success border border-success border-opacity-25 py-2 mb-3 small">
        <i class="fas fa-check-circle me-1"></i> Complaint submitted! We'll review it shortly.
      </div>`;
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('complaintModal'))?.hide();
      }, 2000);
    } else {
      msgDiv.innerHTML = `<div class="alert glass text-danger py-2 mb-3 small">${data.error || 'Failed'}</div>`;
    }
  } catch (e) {
    msgDiv.innerHTML = `<div class="alert glass text-danger py-2 mb-3 small">Error submitting complaint</div>`;
  }
}

// View map
function viewMap(latitude, longitude) {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(mapUrl, '_blank');
}

// Open room detail / booking modal
function openRoomDetail(roomId, hotelId, checkInDate, checkOutDate, totalPrice) {
  const existing = document.getElementById('roomDetailModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'roomDetailModal';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content glass-card overflow-hidden">
        <div class="modal-header bg-dark bg-opacity-50 border-white border-opacity-10 p-4">
          <h5 class="modal-title fw-bold text-white"><i class="fas fa-bed text-info me-2"></i> Confirm Booking</h5>
          <button type="button" class="btn btn-glass p-2 border-0" data-bs-dismiss="modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body p-4">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label text-secondary small">Guest Name</label>
              <input type="text" class="form-control" id="guestName" placeholder="Your full name">
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary small">Phone</label>
              <input type="tel" class="form-control" id="guestPhone" placeholder="Phone number">
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary small">Email</label>
              <input type="email" class="form-control" id="guestEmail" placeholder="Email address">
            </div>
            <div class="col-md-6">
              <label class="form-label text-secondary small">Guests</label>
              <input type="number" class="form-control" id="numGuests" value="1" min="1" max="10">
            </div>
            <div class="col-12">
              <label class="form-label text-secondary small">Special Requests</label>
              <textarea class="form-control" id="specialReq" rows="2" placeholder="Any special requests..."></textarea>
            </div>
          </div>
          <div class="mt-3 p-3 glass rounded-3">
            <div class="d-flex justify-content-between">
              <span class="text-secondary">Check-in:</span><span class="text-white">${checkInDate}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-secondary">Check-out:</span><span class="text-white">${checkOutDate}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold mt-1">
              <span class="text-secondary">Total:</span><span style="color:#68d391;">₹${totalPrice}</span>
            </div>
          </div>
          <div id="bookingMsg" class="mt-2"></div>
        </div>
        <div class="modal-footer bg-dark bg-opacity-50 border-white border-opacity-10 p-4">
          <button type="button" class="btn btn-glass px-4" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-gradient px-4" onclick="confirmRoomBooking('${roomId}','${hotelId}','${checkInDate}','${checkOutDate}',${totalPrice})">
            <i class="fas fa-check me-2"></i> Confirm Booking
          </button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

async function confirmRoomBooking(roomId, hotelId, checkInDate, checkOutDate, totalPrice) {
  const msgDiv = document.getElementById('bookingMsg');
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId, roomId, checkInDate, checkOutDate,
        guestName: document.getElementById('guestName').value || 'Guest',
        guestPhone: document.getElementById('guestPhone').value,
        guestEmail: document.getElementById('guestEmail').value,
        numberOfGuests: document.getElementById('numGuests').value,
        specialRequests: document.getElementById('specialReq').value
      })
    });
    const data = await res.json();
    if (data.success) {
      msgDiv.innerHTML = `<div class="alert glass text-success border border-success border-opacity-25 py-2 small">
        <i class="fas fa-check-circle me-1"></i> Room booked successfully!
      </div>`;
      setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('roomDetailModal'))?.hide(), 2000);
    } else {
      msgDiv.innerHTML = `<div class="alert glass text-danger py-2 small">${data.error || 'Booking failed'}</div>`;
    }
  } catch (e) {
    msgDiv.innerHTML = `<div class="alert glass text-danger py-2 small">Error processing booking</div>`;
  }
}
