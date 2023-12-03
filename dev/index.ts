import mongoose, { Schema } from "mongoose";

//for accessing pw safely:
import "dotenv/config";
const API_KEY = process.env.API_KEY;

//mongoose connection string
import connectionString from "./utils/connectionString.js";

connectionString();

import { groceryProduct, groceryProductSchema } from "./models/products.js";
import express, { urlencoded } from "express";
import path from "path";
import fileDirName from "./utils/file-dir-name.js";
// getBing func
import {
	addBingImg,
	updateAllImgs,
	removeImgs,
	imageReset,
	getBing,
} from "./utils/addBingImage.js";

import AppError from "./utils/AppError.js";

//express setup
const { __dirname, __filename } = fileDirName(import.meta),
	port = process.env.PORT || 8080,
	app = express(); //shortcut for executed express

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname)));
//express ports:
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

app.get("/", async (req, res) => {
	const groceryProductData = await groceryProduct.find();
	res.render("home", { groceryProductData });
});

app.get("/products", async (req, res) => {
	const groceryProductData = await groceryProduct.find(),
		fruitData = await groceryProduct.find({ category: "fruit" }),
		vegetableData = await groceryProduct.find({ category: "vegetable" }),
		dairyData = await groceryProduct.find({ category: "dairy" });
	res.render("products", {
		groceryProductData,
		fruitData,
		dairyData,
		vegetableData,
	});
});

app.get("/product/:id", async (req, res) => {
	const { id } = req.params,
		grocerySingleProductData = await groceryProduct.findById(id);
	res.render("singleProduct", { grocerySingleProductData, id });
});
app.get("/product/new", (req, res) => {
	res.render("newProduct");
});

app.get("/categories/:category", async (req, res) => {
	const { category } = req.params,
		groceryProductData = await groceryProduct.find({
			category: `${category}`,
		});
	res.render("perCategory", { groceryProductData, category });
});

app.post("/search", async (req, res) => {
	const { searchBar } = req.body,
		rawGroceryProductData = await groceryProduct.find(),
		groceryProductData = [];
	for (let individualProduct of rawGroceryProductData) {
		if (individualProduct.name.includes(searchBar.toLowerCase())) {
			groceryProductData.push(individualProduct);
		}
	}
	res.render("search", { groceryProductData, searchBar });
});

app.get("/reset", async (req, res) => {
	await imageReset();
	const groceryProductData = await groceryProduct.find({});
	res.render("products", { groceryProductData });
});

app.get("/addProduct", (req, res) => {
	res.render("newProduct");
});
app.post("/addProduct", async (req, res) => {
	const {
			name: prodName,
			price: prodPrice,
			qty: prodQty,
			unit: prodUnit,
			category: newCategory,
		} = req.body,
		newProd = new groceryProduct({
			name: prodName,
			price: prodPrice,
			qty: prodQty,
			unit: prodUnit,
			category: newCategory,
		}),
		id = newProd._id;

	await newProd.save();
	res.redirect(`/product/${id}`);
});

app.get("/editProduct/:id", async (req, res,next) => {
	const { id } = req.params,
        grocerySingleProductData = await groceryProduct.findById(id)
    if (grocerySingleProductData) {
        const name = grocerySingleProductData.name;
    }
    else { 
        next(new AppError(404, "Cannot Edit a product that does not exists"))
    }
	res.render("editProduct", { grocerySingleProductData, id });
});
app.post("/editProduct/:id", async (req, res) => {
	const { id } = req.params;
	const { price: prodPrice, qty: prodQty } = req.body;
	if (prodPrice !== "" && prodQty !== "") {
		await groceryProduct
			.updateOne(
				{ _id: id },
				{ price: prodPrice, qty: prodQty },
				{ runValidators: true }
			)
			.then((data) => data)
			.catch((err) => err);
	} else if (prodPrice === "" && prodQty !== "") {
		await groceryProduct
			.updateOne({ _id: id }, { qty: prodQty }, { runValidators: true })
			.then((data) => data)
			.catch((err) => err);
	} else if (prodPrice !== "" && prodQty === "") {
		await groceryProduct
			.updateOne(
				{ _id: id },
				{ price: prodPrice },
				{ runValidators: true }
			)
			.then((data) => data)
			.catch((err) => err);
	}
	res.redirect(`/product/${id}`);
});

app.get("*", (req, res) => {
	res.send("Everything else");
});
