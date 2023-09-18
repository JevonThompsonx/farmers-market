import axios from 'axios';
import { configDotenv } from 'dotenv';
import 'dotenv/config'
configDotenv({path: '../.env'})
const UNSPLASH_KEY = process.env.UNSPLASH_KEY

export default async (search)=> {

    const splashData = await axios.get(
    `https://api.unsplash.com/photos/random`,
    {   params: {
        query: search
    },
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_KEY}`,
            'Accept-Version': 'v1',
            'count': 1,
        }
    }
    )
    return splashData.data.urls.full
}