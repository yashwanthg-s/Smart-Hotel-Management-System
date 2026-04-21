// Main JavaScript file for Smart Hotel Management System

// Utility function to show alerts
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.insertBefore(alertDiv, document.body.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get demand level badge
function getDemandBadge(level) {
  const badges = {
    low: '<span class="badge bg-success">🟢 Low</span>',
    medium: '<span class="badge bg-warning">🟡 Medium</span>',
    high: '<span class="badge bg-danger">🔴 High</span>'
  };
  return badges[level] || badges.low;
}

// Fetch with error handling
async function fetchAPI(url, options = {}) {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    if (!response.ok) {
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

// Real-time order status polling
function pollOrderStatus(orderId, callback) {
  const interval = setInterval(async () => {
    try {
      const order = await fetchAPI(`/api/orders/${orderId}`);
      callback(order);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 5000); // Poll every 5 seconds

  return interval;
}

// Stop polling
function stopPolling(intervalId) {
  clearInterval(intervalId);
}
