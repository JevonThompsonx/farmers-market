//steps:
// find current farm/products
// create an array of product ratings
// add all product ratings together and find an average

import connectionString from "./connectionString.js";
import { Request, Response, NextFunction } from "express";
import { groceryProduct } from "../models/index.js";
import { review, rating } from "../models/index.js";
import { stars } from "../models/modelData/index.js";
import { ObjectId } from "mongoose";
const updateProductRating = async (product: ObjectId) => {
  const thisProduct = await groceryProduct
    .findById(product)
    .populate("reviews");
  let index = 0,
    sum = 0,
    lengthOfReviews = thisProduct?.reviews?.length ?? 0;
  for (let index = 0; index < lengthOfReviews; index++) {
    const element = await review.findById(thisProduct?.reviews[index]);
    sum += element?.ratingInNumbers ?? 0;
    if (index + 1 === lengthOfReviews) {
      const rawAverage = sum / lengthOfReviews,
        averageInStars = stars[Math.round(rawAverage) - 1];
      // console.log(`The average is: ${averageFloored}`);
      // console.log(
      //   `The average rating for the post is ${stars[averageFloored - 1]} `,
      // );
      const updatedProduct = await groceryProduct.updateOne(
        { _id: thisProduct?._id },
        {
          rating: {
            ratingInNumbers: rawAverage,
            ratingInStars: averageInStars,
          },
        },
      );
      // console.log(updatedProduct);
    } else {
    }
  }
};

const updateAllProductRatings = async () => {
  try {
    const allProducts = await groceryProduct.find();
    allProducts.forEach(async (product) => {
      //@ts-ignore
      const currentRatingOnProduct = await product?.rating?._id;
      try {
        await review.deleteOne({ _id: currentRatingOnProduct });
        //delete legacy reviews on the original review model for products and farms
      } catch {
        try {
          await rating.deleteOne({ _id: currentRatingOnProduct });
          //deletes new on the current 'rating' model for product and farm auto generated averages only
        } catch { }
      }
      const thisFarm = await groceryProduct.findById(product?._id);
      //@ts-ignore
      await updateProductRating(thisFarm?._id);
    });
  } catch { }
};

export { updateProductRating, updateAllProductRatings };
