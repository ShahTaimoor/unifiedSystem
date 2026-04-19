const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const productService = require('../services/productServicePostgres');
const salesOrderRepository = require('../repositories/postgres/SalesOrderRepository');
const customerRepository = require('../repositories/postgres/CustomerRepository');
const categoryRepository = require('../repositories/postgres/CategoryRepository');

const router = express.Router();

// Middleware to authenticate storefront users (Customers)
const storefrontAuth = async (req, res, next) => {
  try {
    const token = req.cookies.store_token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const customer = await customerRepository.findById(decoded.id);
    if (!customer) throw new Error('Customer not found');
    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Helper to flatten JSONB fields (address, city) to strings for the frontend
const flattenField = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    if (val.length === 0) return '';
    return flattenField(val[0]);
  }
  if (typeof val === 'object') {
    return val.name || val.address || val.city || val.value || JSON.stringify(val);
  }
  return String(val);
};

// @route   POST /api/storefront/login
// @desc    Storefront customer login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    let customer = null;

    if (email) {
      customer = await customerRepository.findAll({ search: email });
      if (customer && customer.length > 0) customer = customer[0];
    }
    if (!customer && phone) {
      customer = await customerRepository.findAll({ search: phone });
      if (customer && customer.length > 0) customer = customer[0];
    }

    if (!customer) {
      return res.status(401).json({ message: 'Account not found. Please contact support.' });
    }

    // Verify password (hardcoded per user request)
    if (password !== 'admin123') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: customer.id || customer._id,
      name: customer.business_name || customer.name || 'Storefront User',
      email: customer.email,
      phone: customer.phone,
      address: flattenField(customer.address),
      city: flattenField(customer.city),
      role: 'customer'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.cookie('store_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ success: true, token, user: payload });
  } catch (error) {
    console.error('Storefront login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/products
// @desc    Get all active products
router.get('/products', async (req, res) => {
  try {
    const queryParams = { ...req.query, status: 'active' };
    const result = await productService.getProducts(queryParams);
    res.json({ data: result.products, pagination: result.pagination });
  } catch (error) {
    console.error('Storefront get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/products/:id
// @desc    Get complete product details
router.get('/products/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 24;
    const page = parseInt(req.query.page) || 1;
    const result = await productService.searchProducts(query, limit, page);
    res.json({ data: result.products, pagination: result.pagination, query });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/search-suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 8;
    const result = await productService.searchProducts(query, limit);
    res.json({ data: { products: result.products }, query });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/categories
// @desc    Get all active categories
router.get('/categories', async (req, res) => {
  try {
    const search = req.query.search || '';
    const categories = await categoryRepository.findAll({ search, isActive: true });
    const mappedCategories = categories.map(cat => ({
      ...cat,
      _id: cat.id,
      slug: (cat.name || '').toLowerCase().trim().replace(/\s+/g, '-'),
      isActive: cat.is_active
    }));
    res.json({ success: true, data: mappedCategories });
  } catch (error) {
    console.error('Storefront get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/storefront/check-stock
// @desc    Check stock availability for multiple products
router.post('/check-stock', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }

    const results = await Promise.all(products.map(async (p) => {
      const product = await productService.getProductById(p.id || p._id);
      if (!product) {
        return {
          id: p.id || p._id,
          success: false,
          isValid: false,
          productTitle: 'Unknown Product',
          availableStock: 0
        };
      }

      const availableStock = product.stock || 0;
      const isValid = !product.isOutOfStock && availableStock >= p.quantity;

      return {
        id: product.id,
        success: true,
        isValid,
        productTitle: product.title,
        availableStock
      };
    }));

    const isValid = results.every(r => r.isValid);
    const outOfStockItems = results.filter(r => r.availableStock <= 0);
    const insufficientStockItems = results.filter(r => r.availableStock > 0 && !r.isValid);

    res.json({
      success: true,
      isValid,
      outOfStockItems,
      insufficientStockItems,
      results
    });
  } catch (error) {
    console.error('Storefront check stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/storefront/orders
// @desc    Get customer orders
router.get('/orders', storefrontAuth, async (req, res) => {
  try {
    const result = await salesOrderRepository.findWithPagination({ customer: req.customer.id }, { limit: 50, sort: 'created_at DESC' });
    res.json({ orders: result.salesOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/storefront/orders
// @desc    Place a new storefront order
router.post('/orders', storefrontAuth, async (req, res) => {
  try {
    const { products, address, phone, amount } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    const items = await Promise.all(products.map(async (p) => {
      const product = await productService.getProductById(p.id || p._id);
      return {
        product: product.id,
        quantity: p.quantity,
        unitPrice: product.pricing?.retail || 0,
        totalPrice: (product.pricing?.retail || 0) * p.quantity
      };
    }));

    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const orderData = {
      customer: req.customer.id,
      items,
      subtotal: total,
      total,
      status: 'draft',
      notes: `Storefront order. Phone: ${phone}, Address: ${address}`,
      soNumber: salesOrderRepository.generateSONumber(),
      createdBy: null,
      updatedBy: null,
    };

    const createdOrder = await salesOrderRepository.create(orderData);
    res.status(201).json({ success: true, message: 'Order created', order: createdOrder });
  } catch (error) {
    console.error('Storefront create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/storefront/me
// @desc    Get current storefront user
router.get('/me', storefrontAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.customer.id || req.customer._id,
      name: req.customer.business_name || req.customer.name,
      email: req.customer.email,
      phone: req.customer.phone,
      address: flattenField(req.customer.address),
      city: flattenField(req.customer.city),
      role: 'customer'
    }
  });
});

// @route   PUT /api/storefront/profile
// @desc    Update customer profile
router.put('/profile', storefrontAuth, async (req, res) => {
  try {
    const { address, phone, city, email } = req.body;
    const updatedCustomer = await customerRepository.update(req.customer.id, {
      address,
      phone,
      city,
      email
    });
    res.json({
      success: true,
      user: {
        id: updatedCustomer.id || updatedCustomer._id,
        name: updatedCustomer.business_name || updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        address: flattenField(updatedCustomer.address),
        city: flattenField(updatedCustomer.city),
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Storefront update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/storefront/logout
// @desc    Storefront customer logout
router.post('/logout', (req, res) => {
  res.clearCookie('store_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
