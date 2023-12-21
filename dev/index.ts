//Database & routing
import mongoose, { Schema } from "mongoose";
import express, { urlencoded, Response, Request, NextFunction } from "express";
//files
import path from "path";
import { AppError, fileDirName, capitalize } from "./utils/index.js";

//for accessing pw safely:
import "dotenv/config";
import { configDotenv } from "dotenv";
configDotenv({ path: "../.env" });
//mongoose connection string
import connectionString from "./utils/connectionString.js";
await connectionString();
//schema, products and farm data
import {
	groceryProduct,
	groceryProductSchema,
	farm,
	farmSchema,
} from "./models/index.js";
// getBing func
import {
	addBingImg,
	updateAllImgs,
	removeImgs,
	imageReset,
	getBing,
} from "./seed/utils/addBingImage.js";
//custom error
//@ts-ignore
import engine from "ejs-mate";

import {
	_503_server_down,
	_404,
	_404_product,
	_404_product_edit,
	_404_cat,
	_404_farm,
	_500_server,
	_400_user,
} from "./errorCodes/index.js";

import {
	joiFarmCreationValiation,
	joiFarmEditValiation,
	joiProductEditValidation,
	joiProductCreationValidation,
} from "./utils/middleware/index.js";

//express setup
const { __dirname } = fileDirName(import.meta),
	port = process.env.PORT || 8080,
	app = express(); //shortcut for executed express

//default pageName
let pageName = "farmersMarket";
//layout
app.engine("ejs", engine);
//express set up
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
//express ports:
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

//home
app.get("/", async (req, res, next) => {
	try {
		const groceryProductData = await groceryProduct.find();
		res.render("home", { groceryProductData, pageName });
	} catch {
		next(new AppError(500, _503_server_down));
	}
});
//all products view
app.get("/products", async (req, res, next) => {
	try {
		const groceryProductData = await groceryProduct.find(),
			fruitData = groceryProductData.filter((data) => {
				if (data.category === "fruit") {
					return data;
				} else {
				}
			}),
			dairyData = groceryProductData.filter((data) => {
				if (data.category === "dairy") {
					return data;
				} else {
				}
			}),
			vegetableData = groceryProductData.filter((data) => {
				if (data.category === "vegetable") {
					return data;
				} else {
				}
			});
		res.render("products/products", {
			fruitData,
			dairyData,
			vegetableData,
			pageName: "Products",
			capitalize,
		});
	} catch {
		next(new AppError(500, _500_server));
	}
});
//single product view
app.get("/product/:id", async (req, res, next) => {
	try {
		const { id } = req.params,
			grocerySingleProductData = await groceryProduct.findById(id),
			pageName = grocerySingleProductData?.name;
		res.render("products/singleProduct", {
			grocerySingleProductData,
			id,
			pageName,
			capitalize,
		});
	} catch {
		next(new AppError(404, _404_product));
	}
});
// get route for new product
app.get("/addProduct", (req, res, next) => {
	try {
		res.render("products/addProduct", { pageName: "New Product" });
	} catch {
		next(new AppError(503, _503_server_down));
	}
});
// post route for new product
app.post(
	"/addProduct",
	joiProductCreationValidation,
	async (req, res, next) => {
		try {
			const {
					name: prodName,
					price: prodPrice,
					qty: prodQty,
					unit: prodUnit,
					category: newCategory,
					size: newSize,
				} = req.body,
				newProd = new groceryProduct({
					name: capitalize(prodName),
					price: prodPrice,
					qty: prodQty,
					unit: prodUnit,
					category: newCategory,
					size: newSize || 1,
				}),
				id = newProd._id;

			await newProd.save();
			res.redirect(`/product/${id}`);
		} catch {
			next(new AppError(400, _400_user));
		}
	}
);

// category view of products
app.get("/categories/:category", async (req, res, next) => {
	try {
		const { category } = req.params,
			groceryProductData = await groceryProduct.find({
				category: `${category}`,
			});
		res.render("products/perCategory", {
			groceryProductData,
			category,
			pageName: category,
			capitalize,
		});
	} catch {
		next(new AppError(404, _404_cat));
	}
});

// searched view of products
app.post("/search", async (req, res, next) => {
	try {
		const { searchBar } = req.body,
			searchedProduct = searchBar.toLowerCase(),
			unfilteredGroceryProductData = await groceryProduct.find({}),
			groceryProductData = unfilteredGroceryProductData.filter((data) => {
				if (data.name.includes(searchedProduct)) {
					return data;
				} else {
				}
			});

		res.render("products/search", {
			groceryProductData,
			searchedProduct,
			pageName: `Search: ${searchedProduct}`,
			capitalize,
		});
	} catch {
		next(new AppError(500, _500_server));
	}
});

//deleting and seeding mongo database
app.get("/reset", async (req, res, next) => {
	try {
		await imageReset();
		res.redirect("/products");
	} catch {
		next(new AppError(500, _500_server));
	}
});

//editing product route
app.get("/editProduct/:id", async (req, res, next) => {
	try {
		const { id } = req.params,
			grocerySingleProductData = await groceryProduct.findById(id);

		res.render("products/editProduct", {
			grocerySingleProductData,
			id,
			pageName: `Edit | ${grocerySingleProductData?.name}` || `Edit `,
			capitalize,
		});
	} catch {
		next(new AppError(404, _404_product_edit));
	}
});
// posting editing product route
app.post(
	"/editProduct/:id",
	joiProductEditValidation,
	async (req, res, next) => {
		try {
			const { id } = req.params,
				{ price: prodPrice, qty: prodQty } = req.body,
				currentProduct = await groceryProduct.findById(id);
			await groceryProduct
				.updateOne(
					{ _id: id },
					{
						price: prodPrice || currentProduct?.price,
						qty: prodQty || currentProduct?.qty,
					}
				)
				.then((data) => data)
				.catch((err) => err);
			res.redirect(`/product/${id}`);
		} catch {
			next(new AppError(400, _400_user));
		}
	}
);
//Farms

app.get("/farms", async (req, res, next) => {
	const allFarms = await farm.find();
	res.render("farms/all", { allFarms, capitalize });
});

app.get("/farms/:id", async (req, res, next) => {
	const { id } = req.params,
		singleFarmData = await farm.findById(id);

	res.render("farms/singleFarm", {
		singleFarmData,
		capitalize,
		pageName: `${singleFarmData?.name} farm`,
	});
});
app.get("/newFarm", (req, res, next) => {
	try {
		res.render("farms/newFarm", { pageName: "New farm" });
	} catch {
		next(new AppError(500, _503_server_down));
	}
});

app.post("/newFarm", async (req, res, next) => {
	try {
		const { name, email, description, city, state } = req.body,
			newFarm = new farm({
				name: name,
				email: email,
				description: description,
				location: {
					city: city,
					state: state,
				},
			});
		await newFarm.save();

		const newFarmId = newFarm._id,
			farmById = await farm.findById(newFarmId);
		res.redirect(`/farms/${newFarmId}`);
	} catch {
		next(new AppError(404, _400_user));
	}
});
// Unknown pages error route
app.get("*", (req, res, next) => {
	next(new AppError(404, _404));
});

let _500_serverErrorImage = "/images/undraw_fixing_bugs.svg",
	_400_ErrorImage = "/images/undraw_location_search.svg",
	_404_engineerErrorImage = "/images/undraw_qa_engineers.svg",
	_503_serverErrorImage = "/images/undraw_server_down.svg";

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
	const { status = 500, message = "Something went wrong" } = err;
	let link, linkText, imageSource;
	if (status === 400 || status === 404) {
		(link = "/"), (linkText = "Home"), (imageSource = _400_ErrorImage);
	} else {
		//500
		(link = "/contact"),
			(linkText = "Contact me"),
			(imageSource = _503_serverErrorImage);
	}
	res.render("error", {
		pageName: `${status} Error`,
		status,
		link,
		linkText,
		message,
		imageSource,
	});
});
