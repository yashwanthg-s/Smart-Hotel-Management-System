const MenuItem = require('../models/MenuItem');
const Hotel = require('../models/Hotel');

// Admin: Get all menu items
exports.getMenuItems = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const items = await MenuItem.find({ hotelId });
    
    res.render('admin/menu', { items });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).render('error', { message: 'Failed to fetch menu items' });
  }
};

// Admin: Create menu item
exports.createMenuItem = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const { name, description, price, category, prepTime, stock, maxStock } = req.body;

    const menuItem = new MenuItem({
      hotelId,
      name,
      description,
      price: parseFloat(price),
      category,
      prepTime: parseInt(prepTime),
      stock: parseInt(stock) || 100,
      maxStock: parseInt(maxStock) || parseInt(stock) || 100,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await menuItem.save();
    res.redirect('/admin/menu');
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).render('error', { message: 'Failed to create menu item' });
  }
};

// Admin: Edit menu item
exports.editMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, prepTime, stock, maxStock } = req.body;

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      prepTime: parseInt(prepTime),
      stock: parseInt(stock),
      maxStock: parseInt(maxStock)
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await MenuItem.findByIdAndUpdate(id, updateData);
    res.redirect('/admin/menu');
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).render('error', { message: 'Failed to update menu item' });
  }
};

// Admin: Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    await MenuItem.findByIdAndDelete(id);
    res.redirect('/admin/menu');
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).render('error', { message: 'Failed to delete menu item' });
  }
};

// Admin: Toggle item availability
exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      id,
      { isAvailable: Boolean(isAvailable) },
      { new: true }
    );
    console.log(`[Menu] Toggle ${item.name}: isAvailable=${item.isAvailable}`);
    res.json({ success: true, isAvailable: item.isAvailable });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
};

// Admin: Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const item = await MenuItem.findByIdAndUpdate(
      id,
      { stock: parseInt(stock) },
      { new: true }
    );

    // Auto disable if stock is 0
    if (item.stock === 0) {
      item.isAvailable = false;
      await item.save();
    } else if (item.stock > 0 && !item.isAvailable) {
      item.isAvailable = true;
      await item.save();
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

// Get menu items for hotel (user view) - show all items including unavailable
exports.getHotelMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const items = await MenuItem.find({ hotelId }); // removed isAvailable filter

    const itemsWithDemand = items.map(item => ({
      ...item.toObject(),
      demandLevel: item.activeOrders > 10 ? 'high' : item.activeOrders > 5 ? 'medium' : 'low'
    }));

    res.json(itemsWithDemand);
  } catch (error) {
    console.error('Error fetching hotel menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};
