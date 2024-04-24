import { AppError } from "./utils/index.js";
import { groceryProduct } from "./models/index.js";
import { _500_server } from "./errorCodes/index.js";
import { app } from "./index.js";

//all products view
app.get("/products", async (req, res, next) => {
	try {
		const groceryProductData = await groceryProduct
			.find()
			.populate(["farm", "reviews"]);
		const fruitData = groceryProductData.filter((data) => {
			if (data.category === "fruit") {
				return data;
			}
		});
		const dairyData = groceryProductData.filter((data) => {
			if (data.category === "dairy") {
				return data;
			}
		});
		const vegetableData = groceryProductData.filter((data) => {
			if (data.category === "vegetable") {
				return data;
			} else {
			}
		});
		res.render("products/products", {
			fruitData,
			vegetableData,
			pageName: "Products",
			capitalize,
			dairyData,
		});
	} catch {
		next(new AppError(500, _500_server));
	}
});
