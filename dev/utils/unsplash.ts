import axios from "axios";
import { configDotenv } from "dotenv";
import "dotenv/config";
configDotenv({ path: "../../.env" });
const UNSPLASH_KEY = process.env.UNSPLASH_KEY;
export default async () => {
	const splashData: any = await axios.get(
		`https://api.unsplash.com/photos/random`,
		{
			params: {
				collections: "8557075,8552800",
				orientation: "squarish",
			},
			headers: {
				Authorization: `Client-ID ${UNSPLASH_KEY}`,
				"Accept-Version": "v1",
			},
		}
	);
	return splashData.data.urls.raw;
};
