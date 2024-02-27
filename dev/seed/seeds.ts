import mongoose from "mongoose";
//for accessing pw safely:
import "dotenv/config";
const API_KEY = process.env.API_KEY;

//mongoose connection string
import seedConnectionString from "./utils/seedConnectionString.js";

import { groceryProduct } from "../models/products.js";
import { farm } from "dev/models/index.js";

// const testObject = new groceryProduct({
//     name: 'gala apple',
//     price: 2,
//     size: 1,
//     sizeType: 'item',
//     category: 'fruit'
// })

// testObject.save().then(data=>console.log(data)).catch(err=>console.log(err))

groceryProduct
  .insertMany([
    {
      name: "Pitted dates",
      // farm:
      price: 15.79,
      size: 1,
      sizeType: "lb",
      qty: 20,
      category: "fruit",
    },
    {
      name: "Black seedless grapes",
      price: 1.68,
      size: 1,
      sizeType: "lb",
      qty: 100,
      category: "fruit",
    },
    {
      name: "Eggplant seed",
      price: 7.96,
      size: 1,
      sizeType: "oz",
      qty: 10,
      category: "vegetable",
    },
    {
      name: "American cheese",
      price: 0.311,
      size: 1,
      sizeType: "oz",
      qty: 6000,
      category: "dairy",
    },
    {
      name: "Parmesan cheese",
      price: 0.388,
      size: 1,
      sizeType: "oz",
      qty: 5000,
      category: "dairy",
    },
    {
      name: "Oatmilk",
      price: 0.109,
      size: 1,
      sizeType: "fl oz",
      qty: 65000,
      category: "dairy",
    },
  ])
  .then((data) => console.log(data))
  .catch((err) => console.log(err));
