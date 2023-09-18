//dotenv config
import { configDotenv } from 'dotenv';
import 'dotenv/config'
configDotenv({path: '../.env'})
//unsplash func 
import getUnsplash from './getUnsplash.js'
//grocerySchema 
import {groceryProductSchema} from '../models/products.js'
//mongoose
import mongoose from 'mongoose'
//api keys
const UNSPLASH_KEY = process.env.UNSPLASH_KEY
const API_KEY = process.env.API_KEY


// const data = await getUnsplash('bacon');

// console.log(groceryProduct)
// console.log(groceryProductSchema)

await mongoose.connect(`mongodb+srv://Jevonx:${API_KEY}@cluster0.q4o1wzp.mongodb.net/?retryWrites=true&w=majority`,{dbName:'expressConnect'})
    .then(
        ()=> {
            console.log("Connection succesful");
        }
    ).catch((err) => {
        console.log(`Connection errrooorr`);
    }
    );


const groceryProduct = mongoose.model('groceryProduct',groceryProductSchema);

const addUnsplashImg = async (productName)=>{
    const unsplashData = await getUnsplash(productName)
    await groceryProduct.updateOne({name:productName}, {imageLink:unsplashData})
    .then(data=>data).catch(err=>err)
    console.log(await groceryProduct.findOne({name:productName}))
}

const updateAllImgs = async ()=> {
    const allProducts = await groceryProduct.find({})
    for (let individualProduct of allProducts) {
        const linkCheck = individualProduct.imageLink
        if (linkCheck === undefined) {
            const unsplashLink = await getUnsplash(individualProduct.name)
            await groceryProduct.updateOne({name:individualProduct.name},{imageLink:unsplashLink})
            const testData = await groceryProduct.findOne({name:individualProduct.name})
            console.log('New object is: ')
            console.log(testData)
        }
        else {
                    console.log('has a valid link')
   
        }
    }

}
export {addUnsplashImg,updateAllImgs}

