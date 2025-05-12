const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// 📦 Get Cart by User ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price"
    );
    if (!cart)
      return res.status(404).json({ error: "Cart not found for this user" });

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to retrieve cart", details: err.message });
  }
});

// 🛒 Create Cart for User (if not exists)
router.post("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid User ID" });
  }

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      const newCart = new Cart({ userId, items: [], totalPrice: 0 });
      cart = await newCart.save();
    }

    res.status(200).json(cart);
  } catch (err) {
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

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ error: "Invalid user or product ID" });
  }

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.quantity < quantity)
      return res.status(400).json({ error: "Insufficient product quantity" });

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      const newCart = new Cart({
        userId,
        items: [{ productId, quantity, price: product.price }],
        totalPrice: product.price * quantity,
      });
      cart = await newCart.save();
      product.quantity -= quantity;
      await product.save();
      return res.status(201).json(cart);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price: product.price });
    }

    product.quantity -= quantity;
    await product.save();

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add item to cart", details: err.message });
  }
});

// ✏️ Update Item Quantity
router.put("/:userId/update", async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ error: "Invalid user or product ID" });
  }

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Quantity must be at least 1" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1)
      return res.status(404).json({ error: "Item not found in cart" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const quantityDiff = quantity - cart.items[itemIndex].quantity;
    if (product.quantity < quantityDiff)
      return res.status(400).json({ error: "Insufficient product quantity" });

    cart.items[itemIndex].quantity = quantity;
    product.quantity -= quantityDiff;
    await product.save();

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update item", details: err.message });
  }
});

// ❌ Remove Item from Cart
router.delete("/:userId/remove", async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ error: "Invalid IDs" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1)
      return res.status(404).json({ error: "Item not found in cart" });

    const removedQty = cart.items[itemIndex].quantity;
    const product = await Product.findById(productId);
    if (product) {
      product.quantity += removedQty;
      await product.save();
    }

    cart.items.splice(itemIndex, 1);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove item", details: err.message });
  }
});

// 🧹 Clear Cart
router.delete("/:userId/clear", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to clear cart", details: err.message });
  }
});

module.exports = router;
