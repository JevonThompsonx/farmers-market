//Database & routing
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
	farm,
	review,
} from "./models/index.js";
// getBing func
import { imageReset } from "./seed/utils/addBingImage.js";
//custom error
//@ts-ignore
import engine from "ejs-mate";
import {
	_503_server_down,
	_404,
	_404_product,
	_404_edit,
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
	joiReviewValidate,
} from "./utils/middleware/index.js";

import {
	_500_serverErrorImage,
	_400_ErrorImage,
	_404_engineerErrorImage,
	_503_serverErrorImage,
} from "./errorCodes/index.js";
//express setup
const { __dirname } = fileDirName(import.meta),
	port = process.env.PORT || 8080,
	app = express(); //shortcut for executed express

//default pageName
let pageName = "farmersMarket";
//layout
app.engine("ejs", engine);
//express set up
app.use(urlencoded({ extended: true }));
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
		const groceryProductData = await groceryProduct
				.find()
				.populate(["farm", "reviews"]),
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
			vegetableData,
			pageName: "Products",
			capitalize,
		});
	} catch {
		next(new AppError(500, _500_server));
	}
});
// get route for new product
app.get("/products/new", async (req, res, next) => {
	try {
		const allFarms = await farm.find();
		res.render("products/new", {
			pageName: "New Product",
			allFarms,
		});
	} catch {
		next(new AppError(503, _503_server_down));
	}
});
//get new product on farm route
app.get("/farms/:id/new", async (req, res, next) => {
	try {
		const { id } = req.params,
			selectedFarm = await farm.findById(id);
		res.render("products/new", {
			pageName: "New Product",
			selectedFarm,
		});
	} catch {
		next(new AppError(503, _503_server_down));
	}
});
//post route for new product
app.post(
	"/products/new",
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
					farmName: newFarmName,
				} = req.body,
				assignedFarm = await farm.findOne({ name: newFarmName }),
				newProd = new groceryProduct({
					name: capitalize(prodName),
					price: prodPrice,
					qty: prodQty,
					unit: prodUnit,
					category: newCategory,
					size: newSize || 1,
					farm: assignedFarm,
				}),
				prodId = newProd._id;
			await newProd.save();
			res.redirect(`/products/${prodId}`);
		} catch {
			next(new AppError(400, _400_user));
		}
	}
);

//get single product view
app.get("/products/:id", async (req, res, next) => {
	try {
		const { id } = req.params,
			singleGroceryProductData = await groceryProduct
				.findById(id)
				.populate(["farm", "reviews"]),
			pageName = singleGroceryProductData?.name,
			singleGroceryProductReviews = singleGroceryProductData?.reviews;
		res.render("products/singleProduct", {
			singleGroceryProductData,
			id,
			pageName,
			capitalize,
		});
	} catch {
		next(new AppError(404, _404_product));
	}
});
//get category view of products
app.get("/categories/:category", async (req, res, next) => {
	try {
		const { category } = req.params,
			groceryProductData = await groceryProduct
				.find({
					category: `${category}`,
				})

				.populate(["farm", "reviews"]);

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
//get route by farm
app.get("/products/farms/:id", async (req, res, next) => {
	try {
		const { id } = req.params,
			groceryProductData = await groceryProduct
				.find({
					farm: { _id: id },
				})
				.populate(["farm", "reviews"]),
			farmName = await farm.findById(id).select("name");
		res.render("products/perFarm", {
			groceryProductData,
			pageName: farmName?.name,
			capitalize,
		});
	} catch {
		next(new AppError(404, _400_user));
	}
});
//searched view of products
app.post("/search", async (req, res, next) => {
	try {
		const { searchBar } = req.body,
			searchedProduct = searchBar.toLowerCase(),
			unfilteredGroceryProductData = await groceryProduct
				.find({})
				.populate(["farm", "reviews"]),
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
//delete and seeding mongo database
app.get("/reset", async (req, res, next) => {
	try {
		await imageReset();
		res.redirect("/products");
	} catch {
		next(new AppError(500, _500_server));
	}
});
//edit product route
app.get("products/:id/edit", async (req, res, next) => {
	try {
		const { id } = req.params,
			singleGroceryProductData = await groceryProduct
				.findById(id)
				.populate(["farm"]);

		res.render("products/edit", {
			singleGroceryProductData,
			id,
			pageName: `Edit | ${singleGroceryProductData?.name}` || `Edit `,
			capitalize,
		});
	} catch {
		next(new AppError(404, _404_edit));
	}
});
// post edit product route
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
			res.redirect(`/products/${id}`);
		} catch {
			next(new AppError(400, _400_user));
		}
	}
);
//all farms
app.get("/farms", async (req, res, next) => {
	const allFarms = await farm.find();
	res.render("farms/all", { allFarms, capitalize });
});
//get new farm
app.get("/farms/new", (req, res, next) => {
	try {
		res.render("farms/new", { pageName: "New farm" });
	} catch {
		next(new AppError(500, _503_server_down));
	}
});
//post new farm
app.post("/farms/new", joiFarmCreationValiation, async (req, res, next) => {
	try {
		const { name, description, email, city, state } = req.body,
			newFarm = new farm({
				name: name,
				email: email,
				description: description,
				location: {
					city: city,
					state: state,
				},
			}),
			newFarmId = newFarm._id;
		await newFarm.save();

		res.redirect(`/farms/${newFarmId}`);
	} catch {
		next(new AppError(404, _400_user));
	}
});
//get single farm
app.get("/farms/:id", async (req, res, next) => {
	try {
		const { id } = req.params,
			singleFarmData = await farm.findById(id).populate("reviews"),
			groceryProductData = await groceryProduct
				.find({
					farm: { _id: id },
				})
				.limit(3);
		res.render("farms/singleFarm", {
			singleFarmData,
			groceryProductData,
			capitalize,
			pageName: `${singleFarmData?.name} farm`,
		});
	} catch {
		next(new AppError(404, _400_user));
	}
});
//get edit single farm
app.get("/farms/:id/edit", async (req, res, next) => {
	try {
		const { id } = req.params,
			singleFarmData = await farm.findById(id);

		res.render("farms/edit", {
			singleFarmData,
			capitalize,
			pageName: `${singleFarmData?.name} farm edit`,
		});
	} catch {
		next(new AppError(404, _404_edit));
	}
});
//post edit farm route
app.post("/farms/:id/edit", joiFarmEditValiation, async (req, res, next) => {
	try {
		const { id } = req.params;
		let { newDescription } = req.body;
		newDescription = newDescription.trim();
		await farm.updateOne({ _id: id }, { description: newDescription });
		res.redirect(`/farms/${id}`);
	} catch {
		next(new AppError(404, _404_edit));
	}
});
//delete farm route
app.get("/farms/:id/delete", async (req, res, next) => {
	try {
		const { id } = req.params,
			allProducts = await groceryProduct.find().populate("farm"),
			filteredProducts = allProducts.filter((product) => {
				let parsedProduct = String(product.farm?._id);
				if (parsedProduct === id) {
					return product;
				} else {
				}
			});
		if (filteredProducts.length < 0) {
			for (let product of filteredProducts) {
				await groceryProduct.deleteOne({ _id: product._id });
			}
		} else {
		}
		await farm.deleteOne({ _id: id });
		res.redirect("/farms");
	} catch {
		next(new AppError(404, _404_edit));
	}
});
app.get("/products/:id/delete", async (req, res, next) => {
	try {
		const { id } = req.params;
		await groceryProduct.deleteOne({ _id: id });
		res.redirect("/products");
	} catch {
		next(new AppError(404, _404_edit));
	}
});

app.post("/products/:id/review", joiReviewValidate, async (req, res, next) => {
	try {
		let { reviewBody, reviewRating } = req.body;
		reviewBody = reviewBody.trim();

		const { id } = req.params,
			reviewArray = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
			reviewToBeSaved = new review({
				body: reviewBody,
				rating: reviewRating,
				ratingInStars: reviewArray[reviewRating - 1],
			}),
			productToBeReviewed = await groceryProduct.findById(id);
		productToBeReviewed?.reviews.push(reviewToBeSaved._id);
		await productToBeReviewed?.save();
		await reviewToBeSaved.save();
		res.redirect(`/products/${id}`);
	} catch {
		next(new AppError(400, _400_user));
	}
});
app.post("/farms/:id/review", joiReviewValidate, async (req, res, next) => {
	try {
		let { reviewBody, reviewRating } = req.body;
		reviewBody = reviewBody.trim();

		const { id } = req.params,
			reviewArray = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
			reviewToBeSaved = new review({
				body: reviewBody,
				rating: reviewRating,
				ratingInStars: reviewArray[reviewRating - 1],
			}),
			farmToBeReviewed = await farm.findById(id);
		farmToBeReviewed?.reviews.push(reviewToBeSaved._id);
		await farmToBeReviewed?.save();
		await reviewToBeSaved.save();
		res.redirect(`/farms/${id}`);
	} catch {
		next(new AppError(400, _400_user));
	}
});
app.get("/products/:productId/review/:reviewId/delete", async (req, res) => {
	const { productId, reviewId } = req.params,
		reviewToDelete = await review.findById(reviewId);

	await groceryProduct.updateOne(
		{ _id: productId },
		{ $pull: { reviews: {ObjectId : reviewId }  } }
	);
	await review.deleteOne({ _id: reviewToDelete });
	res.redirect(`/products/${productId}`);
});
app.get("/farms/:farmId/review/:reviewId/delete", async (req, res) => {
	const { farmId, reviewId } = req.params,
		reviewToDelete = await review.findById(reviewId);
	await farm.updateOne(
		{ _id: farmId },
		{ $pull: { reviews: { $oid: reviewToDelete } } }
	);
	await review.deleteOne({ _id: reviewToDelete });
	res.redirect(`/farms/${farmId}`);
});

// Unknown pages error route
app.get("*", (req, res, next) => {
	next(new AppError(404, _404));
});

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
