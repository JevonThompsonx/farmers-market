import { combinedProductList, } from "../seedData/productData/index.js";
import { farm } from "../../models/index.js";
import randomIntGen from "../../utils/randomIntGen.js";
import seedUtilsConnectionString from "./seedUtilsConnectionString.js";
await seedUtilsConnectionString();
console.log("seeding product:");
const productListLength = combinedProductList.length, randomNameSelector = () => combinedProductList[randomIntGen(productListLength)], unitArray = ["oz", "fl oz", "lbs", "item"], randomUnitSelector = () => unitArray[randomIntGen(unitArray.length)], categoryArray = ["fruit", "vegetable", "dairy"], categoryArrayLength = categoryArray.length, randomCategorySelector = () => categoryArray[randomIntGen(categoryArrayLength - 1)], farmList = await farm.find(), farmListLength = farmList.length, productGenerator = async () => {
    return {
        name: randomNameSelector(),
        price: randomIntGen(50),
        size: randomIntGen(50),
        unit: randomUnitSelector(),
        qty: randomIntGen(50),
        category: randomCategorySelector(),
        farm: farmList[randomIntGen(farmListLength - 1)],
    };
};
const newProduct = productGenerator();
console.log(newProduct);
