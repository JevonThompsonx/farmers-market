import mongoose from 'mongoose';
const {Schema} = mongoose;
import getBing from '../scripts/getBing.js'


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
        enum: ['oz', 'fl oz','lb','item'],
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
        required:false,
    },
    created: {
        type:String,
        required:false
    }
})

groceryProductSchema.pre('save', async function(next) {
  if (!this.created) this.created = new Date;
  if (!this.imageLink) this.imageLink = await getBing(this.name);
  next();
});
groceryProductSchema.pre('updateOne', function(next) {
  if (!this.updated) this.updated = new Date;
  next();
});
const groceryProduct = mongoose.model('groceryProduct',groceryProductSchema)

export {groceryProduct,groceryProductSchema}