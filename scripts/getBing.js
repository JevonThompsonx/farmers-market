import axios from 'axios';
import { configDotenv } from 'dotenv';
import 'dotenv/config'
import https from 'node:https'
configDotenv({path: '../.env'})
const BING_KEY = process.env.BING_KEY


export default async function (search) {
  const result = await axios.get(
     'https://api.bing.microsoft.com/v7.0/images/search',
  {
    params: {q: search,
    count: 1},
    headers: { 'Ocp-Apim-Subscription-Key': BING_KEY }
  }
  )
  return (result.data.value)[0].contentUrl
}
