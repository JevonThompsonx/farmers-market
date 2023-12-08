import axios from "axios";
import { configDotenv } from "dotenv";
import "dotenv/config";
configDotenv({ path: "../../.env" });
const BING_KEY = process.env.BING_KEY;

export default async function (search: String) {
	const result = await axios.get(
		"https://api.bing.microsoft.com/v7.0/images/search",
		{
			params: {
				q: `${search}`,
				safeSearch: "Strict",
				license: "Public",
				count: 10,
			},
			headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
		}
	);
	// return (result.data.value)[0].contentUrl
	let rawData = result.data.value;
	let validLink;
	let linkStatus = false;
	while (linkStatus === false) { 
		for (let individualData of rawData) {
			await axios
				.get(individualData.contentUrl)
				.then(() => {
					validLink = individualData.contentUrl;
					linkStatus = true
				})
				.catch(function (error) {
					if (error.response) {
						console.log("error. Request out of 200 range");
					} else if (error.request) {
						console.log("error. No response");
					} else {
						console.log("error. set up for request failed");
					}
				});
		}
	}

	return validLink;
}
