import axios from 'axios';
import 'dotenv/config'


export default async (search,key)=> {

    const splashData = await axios.get(
    `https://api.unsplash.com/photos/random`,
    {   params: {
        query: search
    },
          headers: {
            'Authorization': `Client-ID ${key}`,
            'Accept-Version': 'v1',
            'count': 1,
        }
    }
    )
    return splashData
}