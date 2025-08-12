const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ---- helpers ----
function handleCastError(err, res) {
  if (err?.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  return null;
}

function calcTotal(cart) {
  cart.totalPrice = cart.items.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
}

// 📦 Get Cart by User ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price available quantity"
    );

    if (!cart) {
      return res.status(404).json({ error: "Cart not found for this user" });
    }

    res.status(200).json(cart);
  } catch (err) {
    if (handleCastError(err, res)) return;
    res
      .status(500)
      .json({ error: "Failed to retrieve cart", details: err.message });
  }
});

// 🛒 Create Cart for User (if not exists)
router.post("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      const newCart = new Cart({ userId, items: [], totalPrice: 0 });
      cart = await newCart.save();
    }

    res.status(200).json(cart);
  } catch (err) {
    if (handleCastError(err, res)) return;
    res.status(500).json({
      error: "Failed to create or retrieve cart",
      details: err.message,
    });
  }
});

// ➕ Add Item to Cart
router.post("/:userId/add", async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }
  const qty = Number(quantity) || 0;
  if (qty < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.available === false)
      return res.status(400).json({ error: "Product is not available" });
    if ((Number(product.quantity) || 0) < qty)
      return res.status(400).json({ error: "Insufficient product quantity" });

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await new Cart({
        userId,
        items: [{ productId, quantity: qty, price: product.price }],
        totalPrice: Number(product.price) * qty,
      }).save();

      product.quantity = (Number(product.quantity) || 0) - qty;
      await product.save();

      return res.status(201).json(cart);
    }

    const idx = cart.items.findIndex(
      (it) => it.productId.toString() === String(productId)
    );

    if (idx > -1) {
      cart.items[idx].quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty, price: product.price });
    }

    product.quantity = (Number(product.quantity) || 0) - qty;
    await product.save();

    calcTotal(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    if (handleCastError(err, res)) return;
    res
      .status(500)
      .json({ error: "Failed to add item to cart", details: err.message });
  }
});

// ✏️ Update Item Quantity
router.put("/:userId/update", async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }
  const newQty = Number(quantity) || 0;
  if (newQty < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const idx = cart.items.findIndex(
      (it) => it.productId.toString() === String(productId)
    );
    if (idx === -1)
      return res.status(404).json({ error: "Item not found in cart" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.available === false)
      return res.status(400).json({ error: "Product is not available" });

    const currentQty = Number(cart.items[idx].quantity) || 0;
    const diff = newQty - currentQty;

    if (diff > 0 && (Number(product.quantity) || 0) < diff) {
      return res.status(400).json({ error: "Insufficient product quantity" });
    }

    cart.items[idx].quantity = newQty;

    // adjust stock by the difference
    product.quantity = (Number(product.quantity) || 0) - diff;
    await product.save();

    calcTotal(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    if (handleCastError(err, res)) return;
    res
      .status(500)
      .json({ error: "Failed to update item", details: err.message });
  }
});

// ❌ Remove Item from Cart
router.delete("/:userId/remove", async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const idx = cart.items.findIndex(
      (it) => it.productId.toString() === String(productId)
    );
    if (idx === -1)
      return res.status(404).json({ error: "Item not found in cart" });

    const removedQty = Number(cart.items[idx].quantity) || 0;

    const product = await Product.findById(productId);
    if (product) {
      product.quantity = (Number(product.quantity) || 0) + removedQty;
      await product.save();
    }

    cart.items.splice(idx, 1);
    calcTotal(cart);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    if (handleCastError(err, res)) return;
    res
      .status(500)
      .json({ error: "Failed to remove item", details: err.message });
  }
});

// 🧹 Clear Cart
router.delete("/:userId/clear", async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    // restore stock
    for (const it of cart.items) {
      const product = await Product.findById(it.productId);
      if (product) {
        product.quantity =
          (Number(product.quantity) || 0) + (Number(it.quantity) || 0);
        await product.save();
      }
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    if (handleCastError(err, res)) return;
    res
      .status(500)
      .json({ error: "Failed to clear cart", details: err.message });
  }
});

module.exports = router;
