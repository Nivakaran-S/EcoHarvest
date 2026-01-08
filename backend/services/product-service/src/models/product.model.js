/**
 * Product Model
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [300, 'Subtitle cannot exceed 300 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    categoryName: {
        type: String,
        trim: true
    },
    vendorId: {
        type: String,
        required: [true, 'Vendor ID is required'],
        index: true
    },
    vendorName: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['Draft', 'Active', 'In Stock', 'Out of Stock', 'Discontinued'],
        default: 'Draft'
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    barcode: String,
    weight: {
        value: Number,
        unit: { type: String, enum: ['g', 'kg', 'lb', 'oz'], default: 'g' }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, enum: ['cm', 'in', 'm'], default: 'cm' }
    },
    tags: [String],
    attributes: [{
        name: String,
        value: String
    }],
    variants: [{
        name: String,
        sku: String,
        price: Number,
        quantity: Number,
        attributes: [{
            name: String,
            value: String
        }]
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    soldCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ vendorId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ soldCount: -1 });

// Auto-update status based on quantity
productSchema.pre('save', function (next) {
    if (this.isModified('quantity')) {
        if (this.quantity === 0) {
            this.status = 'Out of Stock';
        } else if (this.quantity > 0 && this.status === 'Out of Stock') {
            this.status = 'In Stock';
        }
    }
    next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return this.discount || 0;
});

// Virtual for isLowStock
productSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.lowStockThreshold && this.quantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
