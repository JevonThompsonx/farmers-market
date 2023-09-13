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

import {groceryProduct,groceryProductSchema} from './models/products.js'


import express from 'express';
const app = express(); //shortcut for executed express
import path from 'path';
import ejs from 'ejs';

import fileDirName from './scripts/file-dir-name.js'; 

//getUnsplash func
// import getUnsplash from './scripts/getUnsplash.js'
// const UNSPLASH_KEY = process.env.UNSPLASH_KEY; 

//     const getUnsplashData = async(search)=> {
//     const rawData = await getUnsplash(search,UNSPLASH_KEY)
//     const link = rawData.data.urls.full
//     return link
//     }
//     console.log(getUnsplashData('Furry'));


//express setup
const { __dirname, __filename } = fileDirName(import.meta);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname)));
let port = 8080;

//express ports: 
app.listen(port, ()=> {
    console.log(`Listening on port ${port}`);
});

app.get('/', (req,res)=> {
    res.send('Server is twerking')
});

app.get('/products',async (req,res)=>{
    const groceryProductData = await groceryProduct.find();
    res.render('products',{groceryProductData});
})

app.get('/product/:id', async(req,res)=> {
    const {id} = req.params
    const grocerySingleProductData = await groceryProduct.findById(id);
    res.render('singleProduct',{grocerySingleProductData, id});
})
app.get('/product/new', (req,res)=> {
    res.render('newProduct');
})
app.get('/product/:id/edit', async(req,res)=> {
    const {id} = req.params;
    const grocerySingleProductData = await groceryProduct.findById(id);
    res.render('singleProductEdit',{grocerySingleProductData, id});
})
app.get('/categories/:id', async(req,res)=> {
    const {id} = req.params;
    const groceryProductData = await groceryProduct.find({category:`${id}`});
    res.render('perCategory',{groceryProductData, id});
})

app.get('*', (req,res)=> {
    res.send('Everything else');
});