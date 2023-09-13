import mongoose from 'mongoose'; 
const {Schema} = mongoose; //shortcut for Mongoose Schema 
//for accessing pw safely:
import 'dotenv/config'; 
const API_KEY = process.env.API_KEY; 

//mongoose connection string
await mongoose.connect(`mongodb+srv://Jevonx:${API_KEY}@cluster0.q4o1wzp.mongodb.net/?retryWrites=true&w=majority`,{dbName:'expressConnect'})
    .then(
        ()=> {
            console.log("Connection succesful");
        }
    ).catch((err) => {
        console.log(`Connection errrorrrr`);
    }
    );


import groceryProduct from '../models/products.js'


groceryProduct.insertMany([{
    name: 'Pitted dates',
    price:15.79 ,
    size: 1, 
    sizeType: 'lb',
    qty: 20,
    category: 'fruit'
},{
    name: 'Black seedless grapes',
    price: 1.68,
    size: 1, 
    sizeType: 'lb',
    qty: 100,
    category: 'fruit'
},{
    name: 'Eggplant seed',
    price: 7.96,
    size:1 , 
    sizeType: 'oz',
    qty:10 ,
    category: 'vegetable'
},{
    name: 'American cheese',
    price:.311 ,
    size: 1, 
    sizeType: 'oz',
    qty: 6000,
    category: 'dairy'
},{
    name: 'Parmesan cheese',
    price:.388 ,
    size: 1, 
    sizeType: 'oz',
    qty: 5000,
    category: 'dairy'
},{
    name: 'Oatmilk',
    price:.109 ,
    size: 1, 
    sizeType: 'fl oz',
    qty: 65000,
    category: 'dairy'
}]).then(data=>console.log(data)).catch(err=>console.log(err))