import mongoose from 'mongoose';
const {Schema} = mongoose;

const groceryProductSchema = new Schema({
    name: {
        type:String,
        required:true,
        lowercase:true
    },
    price: {
        type:Number,
        required:true,
        min:0
    },
    size: {
        type: Number,
        required:true
    },
    sizeType: {
        type:String,
        required:true,
        enum: ['oz', 'fl oz','lb'],
        lowercase:true
    },
    qty: {
        type:Number,
        required: false,
        default: 0,
        min:0
    },
    category: {
        type: String,
        required:true,
        enum: ['fruit','vegetable','dairy'],
        lowercase:true
    },
    imageLink: {
        type: String,
        required:false
    }
})

const groceryProduct = mongoose.model('groceryProduct',groceryProductSchema)

export {groceryProduct, groceryProductSchema}; 
