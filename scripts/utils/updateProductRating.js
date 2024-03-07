import { groceryProduct } from "../models/index.js";
import { review, rating } from "../models/index.js";
import { stars } from "../models/modelData/index.js";
const updateProductRating = async (product) => {
    const thisProduct = await groceryProduct
        .findById(product)
        .populate("reviews");
    let index = 0, sum = 0, lengthOfReviews = thisProduct?.reviews?.length ?? 0;
    for (let index = 0; index < lengthOfReviews; index++) {
        const element = await review.findById(thisProduct?.reviews[index]);
        sum += element?.ratingInNumbers ?? 0;
        if (index + 1 === lengthOfReviews) {
            const rawAverage = sum / lengthOfReviews, averageFloored = Math.floor(rawAverage), averageInStars = stars[averageFloored - 1];
            const updatedProduct = await groceryProduct.updateOne({ _id: thisProduct?._id }, {
                rating: {
                    ratingInNumbers: averageFloored,
                    ratingInStars: averageInStars,
                },
            });
        }
        else {
        }
    }
};
const updateAllProductRatings = async () => {
    try {
        const allProducts = await groceryProduct.find();
        allProducts.forEach(async (product) => {
            const currentRatingOnProduct = await product?.rating?._id;
            try {
                await review.deleteOne({ _id: currentRatingOnProduct });
            }
            catch {
                try {
                    await rating.deleteOne({ _id: currentRatingOnProduct });
                }
                catch { }
            }
            const thisFarm = await groceryProduct.findById(product?._id);
            await updateProductRating(thisFarm?._id);
        });
    }
    catch { }
};
export { updateProductRating, updateAllProductRatings };
