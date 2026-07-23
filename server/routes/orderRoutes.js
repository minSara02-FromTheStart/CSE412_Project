const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderBuilder = require('../models/OrderBuilder');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('customer').populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer').populate('items.product');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new order (using Builder Pattern)
router.post('/', async (req, res) => {
  try {
    const builder = new OrderBuilder()
      .setCustomer(req.body.customer)
      .setDeliveryAddress(req.body.deliveryAddress);

    (req.body.items || []).forEach(item => {
      builder.addItem(item.product, item.quantity, item.price);
    });

    const order = builder.build();
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;