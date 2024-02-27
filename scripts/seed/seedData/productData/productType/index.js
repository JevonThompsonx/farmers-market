import dairy from "./dairy.js";
import fruits from "./fruits.js";
import veggies from "./veggies.js";
const combinedProductList = dairy.concat(fruits).concat(veggies);
console.log(combinedProductList);
export { dairy, fruits, veggies, combinedProductList };
