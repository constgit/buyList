const mongoose = require('mongoose');

// User Schema
const ItemsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    shop: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: true
    }
});

const Item = mongoose.model('Item', ItemsSchema);
module.exports = Item;