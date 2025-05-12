const Product = require('../models/Products');
const mongoose = require('mongoose');

async function createProduct(req, res) {
    try {
        const { name, description, price, quantity, available } = req.body;
        if (!name || !description || !price || quantity === undefined)
            return res.status(400).json({ error: 'Missing required fields' });

        const newProduct = new Product({ name, description, price, quantity, available });
        const saved = await newProduct.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
}

async function getAllProducts(req, res) {
    try {
        const { page = 1, limit = 10, sort, ...filter } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = Product.find(filter);
        if (sort) query = query.sort(sort.split(',').join(' '));
        query = query.skip(skip).limit(parseInt(limit));

        const products = await query.exec();
        const total = await Product.countDocuments(filter);

        res.status(200).json({ products, currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalProducts: total });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve products', details: error.message });
    }
}

async function getProductById(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product ID' });

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve product', details: error.message });
    }
}

async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product ID' });

        const updated = await Product.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ error: 'Product not found' });

        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
}

async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product ID' });

        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Product not found' });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
}

async function getProductsByCategory(req, res) {
    try {
        const { category } = req.params;
        const products = await Product.find({ category });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve by category', details: error.message });
    }
}

async function searchProducts(req, res) {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: 'Search query is required' });

        const results = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ],
        });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
}

async function updateProductQuantity(req, res) {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product ID' });
        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0)
            return res.status(400).json({ error: 'Invalid quantity value' });

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        product.quantity = quantity;
        const updated = await product.save();
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update quantity', details: error.message });
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    searchProducts,
    updateProductQuantity,
};
