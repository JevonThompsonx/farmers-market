import { configDotenv } from 'dotenv';
import 'dotenv/config';
configDotenv({ path: '../.env' });
import getBing from './getBing.js';
import { groceryProduct } from '../models/products.js';
import mongoose from 'mongoose';
const BING_KEY = process.env.BING_KEY;
const API_KEY = process.env.API_KEY;
await mongoose.connect(`mongodb+srv://Jevonx:${API_KEY}@cluster0.q4o1wzp.mongodb.net/?retryWrites=true&w=majority`, { dbName: 'expressConnect' })
    .then(() => {
    console.log("Connection succesful");
}).catch((err) => {
    console.log(`Connection errrooorr`);
});
const addBingImg = async (productName) => {
    const bingData = await getBing(productName);
    await groceryProduct.updateOne({ name: productName }, { imageLink: bingData })
        .then(data => data).catch(err => err);
    console.log(await groceryProduct.findOne({ name: productName }));
};
const updateAllImgs = async () => {
    const allProducts = await groceryProduct.find({});
    for (let individualProduct of allProducts) {
        const linkCheck = individualProduct.imageLink;
        if (linkCheck === undefined || linkCheck === ' ') {
            const bingLink = await getBing(individualProduct.name);
            await groceryProduct.updateOne({ name: individualProduct.name }, { imageLink: bingLink });
            const testData = await groceryProduct.findOne({ name: individualProduct.name });
            console.log('New object is: ');
            console.log(testData);
        }
        else {
            console.log('has a valid link');
        }
    }
    console.log('All product images up to date');
};
const removeImgs = async () => {
    await groceryProduct.updateMany({}, { imageLink: ' ' });
    console.log('images removed');
};
const imageReset = async () => {
    await removeImgs();
    await updateAllImgs();
};
export { addBingImg, updateAllImgs, removeImgs, imageReset, getBing };
