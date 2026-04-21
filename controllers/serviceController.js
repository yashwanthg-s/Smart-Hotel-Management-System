const ServiceRequest = require('../models/ServiceRequest');

// Service type → department routing
const serviceRouting = {
  water: 'housekeeping',
  napkins: 'housekeeping',
  clean: 'housekeeping',
  extra_cutlery: 'housekeeping',
  sauce: 'housekeeping',
  custom: 'housekeeping',
  bill: 'reception'
};

exports.getServiceRequests = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const user = req.session.user;

    let filter = {
      hotelId,
      status: { $in: ['pending', 'in_progress'] }
    };

    // Filter by department - housekeeping sees their requests, reception sees bill requests
    if (user.department === 'housekeeping') {
      filter.assignedDepartment = 'housekeeping';
    } else if (user.department === 'reception') {
      filter.assignedDepartment = 'reception';
    }
    // waiter sees all

    const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
};

exports.createServiceRequest = async (req, res) => {
  try {
    const { hotelId, tableId, tableNumber, type, customNote } = req.body;

    // Auto-assign department based on service type
    const assignedDepartment = serviceRouting[type] || 'housekeeping';

    const request = await ServiceRequest.create({
      hotelId, tableId, tableNumber, type, customNote,
      assignedDepartment,
      assignedTo: req.session.userId
    });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service request' });
  }
};

exports.getDoneRequests = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const user = req.session.user;
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

    let filter = { hotelId, status: 'done', completedAt: { $gte: startOfDay } };

    if (user.department === 'housekeeping') filter.assignedDepartment = 'housekeeping';
    else if (user.department === 'reception') filter.assignedDepartment = 'reception';

    const requests = await ServiceRequest.find(filter).sort({ completedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch done requests' });
  }
};

exports.updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const request = await ServiceRequest.findByIdAndUpdate(id, {
      status,
      completedAt: status === 'done' ? new Date() : null
    }, { new: true });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service request' });
  }
};
