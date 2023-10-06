import mongoose from 'mongoose'; 
const {Schema} = mongoose; //shortcut for Mongoose Schema 

//for accessing pw safely:
import 'dotenv/config'; 
const API_KEY = process.env.API_KEY; 

//mongoose connection string
await mongoose.connect(`mongodb+srv://Jevonx:${API_KEY}@cluster0.q4o1wzp.mongodb.net/?retryWrites=true&w=majority`,{dbName:'expressConnect'})
    .then(()=> {console.log("Connection succesful");})
    .catch((err) => {console.log(`Connection errrorrrr`);});

// const testObject = new groceryProduct({
//     name: 'gala apple',
//     price: 2,
//     size: 1,
//     sizeType: 'item',
//     category: 'fruit'
// })

// testObject.save().then(data=>console.log(data)).catch(err=>console.log(err))

import {groceryProduct,groceryProductSchema} from './models/products.js'

import express, { urlencoded } from 'express';
const app = express(); //shortcut for executed express
app.use(express.urlencoded({extended:true}))
import path from 'path';
import ejs from 'ejs';


import fileDirName from './scripts/file-dir-name.js'; 

// // getBing func
import {addBingImg,updateAllImgs,removeImgs,imageReset,getBing} from './scripts/addBingImage.js';

//express setup
const { __dirname, __filename } = fileDirName(import.meta);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname)));
let PORT = process.env.PORT

//express ports: 
app.listen(PORT, ()=> {console.log(`Listening on port ${PORT}`);});

app.get('/', async (req,res)=> {
const groceryProductData = await groceryProduct.find();
    res.render('home',{groceryProductData});});


app.get('/products',async (req,res)=>{
    const groceryProductData = await groceryProduct.find();
    const fruitData = await groceryProduct.find({category:'fruit'});
    const vegetableData = await groceryProduct.find({category:'vegetable'});
    const dairyData = await groceryProduct.find({category:'dairy'});

    res.render('products',{groceryProductData,fruitData,dairyData,vegetableData});
})

app.get('/product/:id', async(req,res)=> {
    const {id} = req.params
    const grocerySingleProductData = await groceryProduct.findById(id);
    res.render('singleProduct',{grocerySingleProductData, id});
})
app.get('/product/new', (req,res)=> {res.render('newProduct');})

app.get('/categories/:category', async(req,res)=> {
    const {category} = req.params;
    const groceryProductData = await groceryProduct.find({category:`${category}`});
    res.render('perCategory',{groceryProductData, category});
})


app.post('/search',async (req,res)=> {
    const {searchBar} = req.body
    const rawGroceryProductData = await groceryProduct.find();
    const groceryProductData = []
    for (let individualProduct of rawGroceryProductData) {
        if ((individualProduct.name).includes(searchBar.toLowerCase())) {
            groceryProductData.push(individualProduct)
        }
    }
    res.render('search',{groceryProductData,searchBar});
})

app.get('/reset', async (req,res)=> {
    await imageReset();
    const groceryProductData = await groceryProduct.find({});
    res.render('products',{groceryProductData});
})

app.get('/addProduct', (req,res)=> {
    res.render('newProduct')
})
app.post('/addProduct',async (req,res)=> {
    const {name:prodName,price:prodPrice,qty:prodQty,unit:prodUnit,category:newCategory} = req.body
    console.log(`Data retrieved. Name: ${prodName}`)
    const newProd = new groceryProduct({
        name:prodName,
        price:prodPrice,
        qty:prodQty,
        unit:prodUnit,
        category:newCategory
    })
    await newProd.save();
    console.log('saved. Now adding')
    const grocerySingleProductData = await groceryProduct.findOne({name:prodName});
    const id = grocerySingleProductData.id
    res.redirect(`/product/${id}`);
})

app.get('/editProduct/:id',async (req,res)=>{
    const {id} = req.params
    const grocerySingleProductData = await groceryProduct.findById(id);
    let name = grocerySingleProductData.name
    res.render('editProduct',{grocerySingleProductData,id})
})
app.post('/editProduct/:id',async (req,res)=> {
    const {id} = req.params
    const {price:prodPrice,qty:prodQty} = req.body
    await groceryProduct.updateOne({_id:id},{price:prodPrice,qty:prodQty},{runValidators:true})
    .then(data=>data).catch(err=>err)
    res.redirect(`/product/${id}`);
})


app.get('*', (req,res)=> {res.send('Everything else');});