import "dotenv/config";
import { configDotenv } from "dotenv";
configDotenv({ path: "../.env" });
import { groceryProduct } from "./models/products.js";
import express from "express";
import path from "path";
import fileDirName from "./utils/file-dir-name.js";
import { imageReset, } from "./seed/addBingImage.js";
import AppError from "./utils/AppError.js";
import engine from "ejs-mate";
const { __dirname } = fileDirName(import.meta), port = process.env.PORT || 8080, app = express();
let pageName = "farmersMarket";
app.engine("ejs", engine);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
app.get("/", async (req, res) => {
    const groceryProductData = await groceryProduct.find();
    res.render("home", { groceryProductData, pageName });
});
app.get("/products", async (req, res) => {
    const groceryProductData = await groceryProduct.find(), fruitData = await groceryProduct.find({ category: "fruit" }), vegetableData = await groceryProduct.find({ category: "vegetable" }), dairyData = await groceryProduct.find({ category: "dairy" });
    res.render("products/products", {
        groceryProductData,
        fruitData,
        dairyData,
        vegetableData,
        pageName: "Products",
    });
});
app.get("/product/:id", async (req, res) => {
    const { id } = req.params, grocerySingleProductData = await groceryProduct.findById(id);
    res.render("products/singleProduct", {
        grocerySingleProductData,
        id,
        pageName: id,
    });
});
app.get("/product/new", (req, res) => {
    res.render("products/newProduct", { pageName: "New Product" });
});
app.get("/categories/:category", async (req, res) => {
    const { category } = req.params, groceryProductData = await groceryProduct.find({
        category: `${category}`,
    });
    res.render("products/perCategory", {
        groceryProductData,
        category,
        pageName: category,
    });
});
app.post("/search", async (req, res) => {
    const { searchBar } = req.body, rawGroceryProductData = await groceryProduct.find(), groceryProductData = [];
    for (let individualProduct of rawGroceryProductData) {
        if (individualProduct.name.includes(searchBar.toLowerCase())) {
            groceryProductData.push(individualProduct);
        }
    }
    res.render("products/search", {
        groceryProductData,
        searchBar,
        pageName: `Search: ${searchBar}`,
    });
});
app.get("/reset", async (req, res) => {
    await imageReset();
    res.redirect("/products");
});
app.get("/addProduct", (req, res) => {
    res.render("products/newProduct");
});
app.post("/addProduct", async (req, res) => {
    const { name: prodName, price: prodPrice, qty: prodQty, unit: prodUnit, category: newCategory, } = req.body, newProd = new groceryProduct({
        name: prodName,
        price: prodPrice,
        qty: prodQty,
        unit: prodUnit,
        category: newCategory,
    }), id = newProd._id;
    await newProd.save();
    res.redirect(`products/product/${id}`);
});
app.get("/editProduct/:id", async (req, res, next) => {
    const { id } = req.params, grocerySingleProductData = await groceryProduct.findById(id);
    if (grocerySingleProductData) {
        const name = grocerySingleProductData.name;
    }
    else {
        next(new AppError(404, "Cannot Edit a product that does not exists"));
    }
    res.render("products/editProduct", { grocerySingleProductData, id });
});
app.post("/editProduct/:id", async (req, res) => {
    const { id } = req.params;
    const { price: prodPrice, qty: prodQty } = req.body;
    if (prodPrice !== "" && prodQty !== "") {
        await groceryProduct
            .updateOne({ _id: id }, { price: prodPrice, qty: prodQty }, { runValidators: true })
            .then((data) => data)
            .catch((err) => err);
    }
    else if (prodPrice === "" && prodQty !== "") {
        await groceryProduct
            .updateOne({ _id: id }, { qty: prodQty }, { runValidators: true })
            .then((data) => data)
            .catch((err) => err);
    }
    else if (prodPrice !== "" && prodQty === "") {
        await groceryProduct
            .updateOne({ _id: id }, { price: prodPrice }, { runValidators: true })
            .then((data) => data)
            .catch((err) => err);
    }
    res.redirect(`products/product/${id}`);
});
app.get("*", (req, res, next) => {
    next(new AppError(404, "Page not found or does not exists"));
});
