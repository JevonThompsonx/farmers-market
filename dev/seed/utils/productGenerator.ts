import {
  combinedProductList,
  farmNames,
} from "../seedData/productData/index.js";
import { groceryProduct } from "../../models/index.js";
import randomIntGen from "../../utils/randomIntGen.js";
import { farm } from "../../models/index.js";
import { randReview } from "./generateReview.js";
const productListLength = combinedProductList.length,
  randomNameSelector = () =>
    combinedProductList[randomIntGen(productListLength)],
  unitArray = ["oz", "fl oz", "lbs", "item"],
  randomUnitSelector = () => unitArray[randomIntGen(unitArray.length)],
  categoryArray = ["fruit", "vegetable", "dairy"],
  categoryArrayLength = categoryArray.length,
  randomCategorySelector = () =>
    categoryArray[randomIntGen(categoryArrayLength)],
  farmList = await farm.find(),
  farmListLength = farmList.length,
  productGenerator = async () => {
    return {
      name: randomNameSelector(),
      price: randomIntGen(50),
      size: randomIntGen(50),
      unit: randomUnitSelector(),
      qty: randomIntGen(50),
      category: randomCategorySelector(),
      //imageLink is auto generated on save
      farm: farmList[randomIntGen(farmListLength)],
      reviews: [randReview(), randReview(), randReview(), randReview()],
    };
  };

// ratingSchema = new Schema({
//    ratingInNumbers: {
//      type: Number,
//      required: true,
//    },
//    ratingInStars: {
//      type: String,
//      required: true,
//      enum: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
//    },
//  }),
