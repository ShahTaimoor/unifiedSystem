const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { auth, requirePermission } = require("../middleware/auth");
const productService = require("../services/productServicePostgres");
const categoryService = require("../services/categoryServicePostgres");
const salesOrderRepository = require("../repositories/postgres/SalesOrderRepository");
const customerRepository = require("../repositories/postgres/CustomerRepository");
const productRepository = require("../repositories/postgres/ProductRepository");
const SettingsRepository = require("../repositories/postgres/SettingsRepository");
const { query: pgQuery } = require("../config/postgres");

const router = express.Router();

const slugify = (value) => {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const decodeHtmlEntities = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

const resolveCustomerIdForUser = async (user) => {
  if (!user) return null;
  const searchTerm =
    user.email || user.phone || user.username || user.name || user.firstName;
  if (!searchTerm) return null;

  const customers = await customerRepository.findAll(
    { search: searchTerm },
    { limit: 5 },
  );
  if (!customers || customers.length === 0) return null;

  const exactMatch = customers.find((customer) => {
    const normalized = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    return (
      normalized(customer.email) === normalized(user.email) ||
      normalized(customer.phone) === normalized(user.phone) ||
      normalized(customer.name) === normalized(user.name) ||
      normalized(customer.business_name) === normalized(user.username) ||
      normalized(customer.business_name) === normalized(user.name)
    );
  });
  return (
    (exactMatch && (exactMatch.id || exactMatch._id)) ||
    customers[0].id ||
    customers[0]._id
  );
};

const normalizeOrder = (order) => {
  // Map items to products format for frontend compatibility
  const rawItems = order.items || order.products || [];
  const products = rawItems.map((item) => {
    const productData = item.product || item.id || item;
    return {
      ...item,
      product: {
        ...(typeof productData === "object" ? productData : {}),
        _id: productData?._id || productData?.id || item.id || item.product_id,
        title:
          productData?.title || productData?.name || "Unnamed Product",
        price:
          item.unitPrice || productData?.price || productData?.sellingPrice || 0,
        image:
          productData?.image ||
          productData?.imageUrl ||
          productData?.image_url ||
          null,
        picture: productData?.picture || {
          secure_url:
            productData?.image ||
            productData?.imageUrl ||
            productData?.image_url ||
            null,
        },
      },
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || productData?.price || 0,
    };
  });

  const normalized = {
    ...order,
    _id: order._id || order.id,
    createdAt: order.createdAt || order.created_at,
    updatedAt: order.updatedAt || order.updated_at,
    shippingAddress: order.shippingAddress || order.shipping_address,
    shippingPhone: order.shippingPhone || order.shipping_phone,
    shippingCity: order.shippingCity || order.shipping_city,
    address: order.shippingAddress || order.shipping_address || order.address,
    phone: order.shippingPhone || order.shipping_phone || order.phone,
    city: order.shippingCity || order.shipping_city || order.city,
    status: order.status || "Pending",
    price: order.total || order.subtotal || order.price || 0,
    products,
  };
  return normalized;
};

const enrichOrders = async (orders) => {
  if (!orders || orders.length === 0) return orders;

  const productIds = new Set();
  orders.forEach((order) => {
    const rawItems = order.items || order.products || [];
    rawItems.forEach((item) => {
      const pid = item.product || item.product_id || item.id;
      if (
        pid &&
        typeof pid === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          pid,
        )
      ) {
        productIds.add(pid);
      }
    });
  });

  if (productIds.size === 0) return orders;

  const products = await productRepository.findAll(
    { ids: Array.from(productIds) },
    { limit: productIds.size },
  );
  const productMap = new Map(products.map((p) => [p.id, p]));

  orders.forEach((order) => {
    const rawItems = order.items || order.products || [];
    rawItems.forEach((item) => {
      const pid = item.product || item.product_id || item.id;
      if (pid && typeof pid === "string" && productMap.has(pid)) {
        item.product = productMap.get(pid);
      } else if (pid && typeof pid === "object" && (pid.id || pid._id)) {
        const id = pid.id || pid._id;
        if (productMap.has(id)) {
          item.product = { ...pid, ...productMap.get(id) };
        }
      }
    });
  });

  return orders;
};

const adaptCategory = (category) => {
  if (!category) return category;
  const adapted = {
    ...category,
    _id: category._id || category.id || null,
    id: category.id || category._id || null,
    slug: category.slug || slugify(category.name || ""),
    active: category.active !== undefined ? category.active : category.isActive,
    position: category.position !== undefined ? category.position : category.sortOrder,
    image:
      category.image ||
      category.imageUrl ||
      category.picture?.secure_url ||
      category.picture?.url ||
      null,
  };

  if (adapted.isActive === undefined && category.active !== undefined) {
    adapted.isActive = category.active;
  }
  return adapted;
};

const adaptProduct = (product) => {
  if (!product) return product;
  const imageSource =
    product.image || product.imageUrl || product.picture?.secure_url || null;
  const adapted = {
    ...product,
    title: product.title || product.name || "",
    price:
      product.price != null
        ? product.price
        : (product.pricing?.retail ?? product.pricing?.wholesale ?? 0),
    stock:
      product.stock != null
        ? product.stock
        : (product.inventory?.availableStock ??
          product.inventory?.currentStock ??
          0),
    image: decodeHtmlEntities(imageSource),
  };

  if (adapted.category) {
    adapted.category = {
      ...adapted.category,
      _id: adapted.category._id || adapted.category.id,
      id: adapted.category.id || adapted.category._id,
      slug: adapted.category.slug || slugify(adapted.category.name || ""),
      active:
        adapted.category.active !== undefined
          ? adapted.category.active
          : adapted.category.isActive,
    };
  }

  return adapted;
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route GET /api/storefront-company
// @desc  Get public company information for e-commerce storefront
router.get("/storefront-company", async (req, res, next) => {
  try {
    const settings = await SettingsRepository.getSettings();
    const company = settings || {};
    res.json({
      data: {
        companyName: company.companyName || company.company_name || "GULTRADERS",
        phone: company.contactNumber || company.contact_number || company.phone || "+92 311 4000096",
        address: company.address || "Grand Dil jan Plaza, Block A, Shop #7,8,9, Opposite Fahad CNG Pump, Near Toyota Khyber, Ring Road Peshawar, KPK, Pakistan",
        logo: company.logo || "/logo.jpeg"
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/get-products
// @desc  Product listing for e-commerce
router.get(
  "/get-products",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 10000 }),
    query("stockFilter").optional().isIn(["active", "inactive", "all"]),
    query("sortBy").optional().trim(),
    query("category").optional().trim(),
    query("search").optional().trim(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { category, page, limit, stockFilter, sortBy, search } = req.query;
      const queryParams = {
        category,
        page,
        limit,
        sortBy,
        search,
      };

      if (stockFilter === "active") {
        queryParams.status = "active";
      } else if (stockFilter === "inactive") {
        queryParams.status = "inactive";
      }

      const result = await productService.getProducts(queryParams);
      const data = Array.isArray(result.products)
        ? result.products.map(adaptProduct)
        : [];
      const pagination = {
        page: result.pagination?.page || 1,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.pages || 1,
      };

      res.json({ data, pagination });
    } catch (error) {
      next(error);
    }
  },
);

// @route GET /api/single-product/:id
// @desc  Single product fetch for e-commerce
router.get(
  "/single-product/:id",
  [param("id").isUUID(4).withMessage("Valid product ID is required")],
  handleValidation,
  async (req, res, next) => {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json({ product: adaptProduct(product) });
    } catch (error) {
      next(error);
    }
  },
);

// @route GET /api/all-category
// @desc  Category list for e-commerce
router.get(
  "/all-category",
  [query("search").optional().trim()],
  handleValidation,
  async (req, res, next) => {
    try {
      const categoriesResult = await categoryService.getCategories({
        search: req.query.search,
        page: 1,
        limit: 9999,
        isActive: true,
      });
      const data = Array.isArray(categoriesResult.categories)
        ? categoriesResult.categories.map(adaptCategory)
        : [];
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

const resolveCategoryBySlugOrId = async (slug) => {
  if (!slug) return null;
  const maybeId = String(slug).trim();
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      maybeId,
    )
  ) {
    return categoryService.getCategoryById(maybeId);
  }
  return categoryService.getCategoryByName(slug);
};

// @route GET /api/single-category/:slug
// @desc  Single category details for e-commerce
router.get(
  "/single-category/:slug",
  [param("slug").trim().notEmpty().withMessage("Category slug is required")],
  handleValidation,
  async (req, res, next) => {
    try {
      const category = await resolveCategoryBySlugOrId(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ data: adaptCategory(category) });
    } catch (error) {
      next(error);
    }
  },
);

// @route   GET /api/search
// @desc    Search products for e-commerce
router.get(
  "/search",
  [
    query("q").trim().notEmpty().withMessage("Search query is required"),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("page").optional().isInt({ min: 1 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const q = req.query.q;
      const limit = parseInt(req.query.limit, 10) || 20;
      const page = parseInt(req.query.page, 10) || 1;
      const products = await productService.searchProducts(q, limit);
      const adaptedProducts = Array.isArray(products)
        ? products.map(adaptProduct)
        : [];
      res.json({
        data: adaptedProducts,
        query: q,
        pagination: {
          total: adaptedProducts.length,
          page,
          limit,
          totalPages: 1,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   GET /api/search-suggestions
// @desc    Suggest product search results for e-commerce
router.get(
  "/search-suggestions",
  [
    query("q").trim().notEmpty().withMessage("Search query is required"),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const q = req.query.q;
      const limit = parseInt(req.query.limit, 10) || 8;
      const products = await productService.searchProducts(q, limit);
      const adaptedProducts = Array.isArray(products)
        ? products.map(adaptProduct)
        : [];
      res.json({
        data: {
          products: adaptedProducts,
          categories: [],
        },
        query: q,
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route GET /api/get-orders-by-user-id
// @desc  Get sales orders for the logged in customer
router.get("/get-orders-by-user-id", auth, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customerId = await resolveCustomerIdForUser(req.user);
    if (!customerId) {
      return res.json({ data: [] });
    }

    const orders = await salesOrderRepository.findByCustomer(customerId);
    const enrichedOrders = await enrichOrders(orders);
    const normalizedOrders = Array.isArray(enrichedOrders)
      ? enrichedOrders.map(normalizeOrder)
      : [];

    res.json({ data: normalizedOrders });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/get-all-orders
// @desc  Get paginated sales orders for e-commerce admin
router.get(
  "/get-all-orders",
  auth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 24;
      const result = await salesOrderRepository.findWithPagination(
        {},
        { page, limit },
      );
      const enrichedOrders = await enrichOrders(result.salesOrders);
      res.json({
        data: enrichedOrders.map(normalizeOrder),
        totalPages: result.pagination?.pages || 1,
        currentPage: result.pagination?.current || 1,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route GET /api/pending-orders-count
// @desc  Count active sales orders for e-commerce admin
router.get("/pending-orders-count", auth, async (req, res, next) => {
  try {
    const result = await pgQuery(
      "SELECT COUNT(*) AS count FROM sales_orders WHERE deleted_at IS NULL AND status IN ('draft', 'confirmed', 'partially_invoiced')",
    );
    const count = parseInt(result.rows[0]?.count || "0", 10);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/update-order-status/:id
// @desc  Update existing sales order status for e-commerce admin
router.put(
  "/update-order-status/:id",
  auth,
  requirePermission("edit_sales_orders"),
  [
    param("id").isUUID(4).withMessage("Valid order ID is required"),
    body("status").trim().notEmpty().withMessage("Status is required"),
    body("packerName").optional().trim(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { status, packerName } = req.body;
      const salesOrder = await salesOrderRepository.findById(req.params.id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      if (
        ["confirmed", "partially_invoiced", "fully_invoiced"].includes(
          salesOrder.status,
        )
      ) {
        return res.status(400).json({
          message: "Cannot update order after confirmation or invoicing",
        });
      }
      const updateData = {
        status,
        lastModifiedBy: req.user?.id || req.user?._id,
      };
      if (packerName) {
        updateData.notes =
          `${salesOrder.notes || ""} ${packerName ? `Packer: ${packerName}` : ""}`.trim();
      }
      const updatedOrder = await salesOrderRepository.update(
        req.params.id,
        updateData,
      );
      res.json({ data: updatedOrder });
    } catch (error) {
      next(error);
    }
  },
);

// @route DELETE /api/delete-order/:id
// @desc  Delete sales order for e-commerce admin
router.delete(
  "/delete-order/:id",
  auth,
  requirePermission("delete_sales_orders"),
  [param("id").isUUID(4).withMessage("Valid order ID is required")],
  handleValidation,
  async (req, res, next) => {
    try {
      const salesOrder = await salesOrderRepository.findById(req.params.id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      if (salesOrder.status !== "draft") {
        return res
          .status(400)
          .json({ message: "Only draft orders can be deleted" });
      }
      await salesOrderRepository.delete(req.params.id);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

// @route DELETE /api/bulk-delete-orders
// @desc  Bulk delete sales orders for e-commerce admin
router.delete(
  "/bulk-delete-orders",
  auth,
  requirePermission("delete_sales_orders"),
  [
    body("orderIds")
      .isArray({ min: 1 })
      .withMessage("orderIds array is required"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { orderIds } = req.body;
      const results = [];
      for (const id of orderIds) {
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
          )
        ) {
          results.push({ id, success: false, error: "Invalid order id" });
          continue;
        }
        const salesOrder = await salesOrderRepository.findById(id);
        if (!salesOrder) {
          results.push({ id, success: false, error: "Order not found" });
          continue;
        }
        if (salesOrder.status !== "draft") {
          results.push({
            id,
            success: false,
            error: "Only draft orders can be deleted",
          });
          continue;
        }
        await salesOrderRepository.delete(id);
        results.push({ id, success: true });
      }
      res.json({ results });
    } catch (error) {
      next(error);
    }
  },
);

// @route POST /api/order
// @desc  Create an e-commerce sales order and sync to POS
router.post(
  "/order",
  auth,
  [
    body("products").isArray({ min: 1 }).withMessage("Products are required"),
    body("products.*.id")
      .isUUID(4)
      .withMessage("Each product must include a valid ID"),
    body("products.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each product must include a positive quantity"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let customerId = null;
      const searchTerm =
        req.user?.email ||
        req.user?.phone ||
        req.user?.username ||
        req.user?.name;
      if (searchTerm) {
        const existingCustomers = await customerRepository.findAll(
          { search: searchTerm },
          { limit: 1 },
        );
        if (existingCustomers.length > 0) {
          customerId = existingCustomers[0].id || existingCustomers[0]._id;
        }
      }

      if (!customerId) {
        const name =
          [
            req.user?.firstName || req.user?.name || null,
            req.user?.lastName || null,
          ]
            .filter(Boolean)
            .join(" ") || null;
        const newCustomer = await customerRepository.create({
          name,
          email: req.user?.email || null,
          phone: req.user?.phone || null,
          address: req.body.address || null,
          businessType: "retail",
          isActive: true,
          createdBy: userId,
        });
        customerId = newCustomer?.id || newCustomer?._id;
      }

      const products = req.body.products || [];
      const orderItems = [];
      let subtotal = 0;

      for (const item of products) {
        const product = await productService.getProductById(item.id);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product not found: ${item.id}` });
        }

        const quantity = Number(item.quantity) || 0;
        if (quantity < 1) {
          return res.status(400).json({ message: "Invalid product quantity" });
        }

        const unitPrice = Number(product.price ?? product.pricing?.retail ?? 0);
        const totalPrice = Number((unitPrice * quantity).toFixed(2));
        subtotal += totalPrice;

        orderItems.push({
          id: product._id,
          product: product, // Include full product object
          quantity,
          unitPrice,
          totalPrice,
          remainingQuantity: quantity,
        });
      }

      const createdOrder = await salesOrderRepository.create({
        customer: customerId,
        items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2)),
        status: "confirmed",
        orderType: "retail",
        orderDate: new Date(),
        shipping_address: req.body.address,
        shipping_phone: req.body.phone,
        shipping_city: req.body.city,
        notes: `E-commerce order (structured)`.trim(),
        createdBy: userId,
      });

      res.status(201).json({ success: true, data: createdOrder });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
