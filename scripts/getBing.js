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
    count: 10},
    headers: { 'Ocp-Apim-Subscription-Key': BING_KEY }
  }
  )

  let rawData = result.data.value;
  let validLink;
  for (let individualData of rawData) {

    await axios.get(individualData.contentUrl) 
    .then (function () {
    validLink = individualData.contentUrl
      }
    )
    .catch(function (error) {
      if (error.response) {
        console.log('error. Request out of 200 range')
      } 
          else if (error.request) { 
            console.log('error. No response')
          }
      else {
        console.log('error. set up for request failed')
      }
    }
    )

    } 

  return validLink
}
