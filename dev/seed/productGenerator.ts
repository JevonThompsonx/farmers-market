import {
  fruitList,
  vegetableList,
  milkDairyList,
  cheeseDairyList,
  liquidUnits,
  fruitUnits,
  cheeseUnits,
  cheeseForms,
  vegetableForms,
  fruitForms,
  milkDiaryForms,
} from "./seedData/productData/index.js";
import { groceryProduct, farm } from "../models/index.js";
import randomIntGen from "../utils/randomIntGen.js";
import seedConnectionString from "./seedConnectionString.js";
import vegetableUnits from "./seedData/productData/unitType/vegetableUnits.js";

const productGenerator = async () => {
  const prodTypeArray = ["fruit", "vegetable", "milkDairy", "cheeseDairy"],
    productType = prodTypeArray[randomIntGen(prodTypeArray.length - 1)],
    findCategory = (productType: String): String => {
      if (productType === "fruit") {
        return "fruit";
      } else if (productType === "milkDairy" || productType === "cheeseDairy") {
        return "dairy";
      } else {
        return "vegetable";
      }
    },
    productListLength = (productType: String) => {
      if (productType === "fruit") {
        return fruitList.length;
      } else if (productType === "milkDairy") {
        return milkDairyList.length;
      } else if (productType === "cheeseDairy") {
        return cheeseDairyList.length;
      } else {
        return vegetableList.length;
      }
    },
    listType = (productType: String) => {
      if (productType === "fruit") {
        return fruitList;
      } else if (productType === "milkDairy") {
        return milkDairyList;
      } else if (productType === "cheeseDairy") {
        return cheeseDairyList;
      } else {
        return vegetableList;
      }
    },
    randomNameSelector = () =>
      listType(productType)[randomIntGen(productListLength(productType) - 1)],
    unitArray = (productType: String): String[] => {
      if (productType === "fruit") {
        return fruitUnits;
      } else if (productType === "milkDairy") {
        return liquidUnits;
      } else if (productType === "cheeseDairy") {
        return cheeseUnits;
      } else {
        return vegetableUnits;
      }
    },
    randomUnitSelector = () =>
      unitArray(productType)[randomIntGen(unitArray.length - 1)],
    farmList = await farm.find(),
    farmListLength = farmList.length,
    randomFarmSelector = () => {
      const randomNum = randomIntGen(farmListLength - 1);
      const index = randomNum <= 0.9999 ? randomNum : 0;
      return farmList[index]._id;
    },
    formList = (productType: String): String[] => {
      if (productType === "fruit") {
        return fruitForms;
      } else if (productType === "milkDairy") {
        return milkDiaryForms;
      } else if (productType === "cheeseDairy") {
        return cheeseForms;
      } else {
        return vegetableForms;
      }
    },
    randomFormSelector = () => {
      if (formList.length - 1 <= 0.999) {
        return formList(productType)[0];
      } else {
        return formList(productType)[randomIntGen(formList.length - 1)];
      }
    },
    productGen = () => {
      return {
        name: randomNameSelector(),
        price: randomIntGen(50),
        size: randomIntGen(50),
        unit: randomUnitSelector(),
        qty: randomIntGen(50),
        category: findCategory(productType),
        form: randomFormSelector(),
        //imageLink is auto generated on save
        farm: randomFarmSelector(),
      };
    };
  const newProduct = productGen();
  console.log(newProduct);
};

productGenerator();
