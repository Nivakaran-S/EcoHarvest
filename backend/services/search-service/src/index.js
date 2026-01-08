/**
 * Search Service - Product Search & Discovery
 * Uses Redis for caching, designed for Elasticsearch integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3011;

// Redis for caching search results
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Mock product data for search (would normally come from Elasticsearch)
const mockProducts = [
    { id: '1', name: 'Organic Apples', category: 'Fruits', price: 150, rating: 4.5 },
    { id: '2', name: 'Fresh Bananas', category: 'Fruits', price: 60, rating: 4.2 },
    { id: '3', name: 'Green Spinach', category: 'Vegetables', price: 40, rating: 4.8 },
    { id: '4', name: 'Organic Tomatoes', category: 'Vegetables', price: 80, rating: 4.3 },
    { id: '5', name: 'Brown Rice', category: 'Grains', price: 120, rating: 4.6 },
    { id: '6', name: 'Organic Honey', category: 'Pantry', price: 350, rating: 4.9 },
    { id: '7', name: 'Fresh Milk', category: 'Dairy', price: 55, rating: 4.4 },
    { id: '8', name: 'Free Range Eggs', category: 'Dairy', price: 90, rating: 4.7 }
];

// Popular search terms
const popularSearches = [
    'organic vegetables',
    'fresh fruits',
    'dairy products',
    'whole grains',
    'natural honey',
    'farm fresh'
];

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'search-service' });
});

// Search products
app.get('/products', async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, sortBy = 'relevance', page = 1, limit = 20 } = req.query;

        // Check cache
        const cacheKey = `search:${JSON.stringify(req.query)}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // Filter products
        let results = [...mockProducts];

        if (q) {
            const query = q.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );

            // Track search analytics
            await redis.zincrby('search:popular', 1, q.toLowerCase());
        }

        if (category) {
            results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }

        if (minPrice) {
            results = results.filter(p => p.price >= parseFloat(minPrice));
        }

        if (maxPrice) {
            results = results.filter(p => p.price <= parseFloat(maxPrice));
        }

        // Sort
        switch (sortBy) {
            case 'price_asc':
                results.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                results.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                results.sort((a, b) => b.rating - a.rating);
                break;
            default:
                // relevance - keep original order
                break;
        }

        // Paginate
        const start = (page - 1) * limit;
        const paginatedResults = results.slice(start, start + parseInt(limit));

        const response = {
            success: true,
            data: paginatedResults,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: results.length,
                totalPages: Math.ceil(results.length / limit)
            },
            facets: {
                categories: [...new Set(mockProducts.map(p => p.category))],
                priceRange: {
                    min: Math.min(...mockProducts.map(p => p.price)),
                    max: Math.max(...mockProducts.map(p => p.price))
                }
            }
        };

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(response));

        res.json(response);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// Auto-complete suggestions
app.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const query = q.toLowerCase();
        const suggestions = mockProducts
            .filter(p => p.name.toLowerCase().includes(query))
            .map(p => p.name)
            .slice(0, 5);

        res.json({ success: true, data: suggestions });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get suggestions' });
    }
});

// Popular searches
app.get('/popular', async (req, res) => {
    try {
        // Get from Redis sorted set
        const cached = await redis.zrevrange('search:popular', 0, 9, 'WITHSCORES');

        if (cached && cached.length > 0) {
            const searches = [];
            for (let i = 0; i < cached.length; i += 2) {
                searches.push({ term: cached[i], count: parseInt(cached[i + 1]) });
            }
            return res.json({ success: true, data: searches });
        }

        res.json({ success: true, data: popularSearches.map(term => ({ term, count: 0 })) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get popular searches' });
    }
});

// Search analytics
app.get('/analytics', async (req, res) => {
    try {
        const topSearches = await redis.zrevrange('search:popular', 0, 19, 'WITHSCORES');

        const analytics = [];
        for (let i = 0; i < topSearches.length; i += 2) {
            analytics.push({ term: topSearches[i], count: parseInt(topSearches[i + 1]) });
        }

        res.json({
            success: true,
            data: {
                topSearches: analytics,
                totalSearches: analytics.reduce((sum, a) => sum + a.count, 0)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🔍 Search Service running on port ${PORT}`);
});

module.exports = app;
