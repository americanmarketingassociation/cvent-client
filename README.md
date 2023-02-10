# (if you're looking at this lib right now, keep in mind that this is still a working in progress)
# CVent Client
Use this library to interact with the [CVent Platform](https://www.cvent.com/). It uses the  [Cvent REST API](https://developer-portal.cvent.com/documentation) under the hood 
## How to use the library
<!-- TODO: Improve this section  -->
- Get `CLIENT_ID` and `SECRET_ID` from the CVent Platform (SHOW HOW!);
- Create a a lib instance:
```js
import cventClient from 'cvent-client';

const cventClient = new CVentClient({
  CVENT_CLIENT_ID,
  CVENT_CLIENT_SECRET,
});
```


- Interact with the API by using the available functions:
```js
const contactId = await cventClient.createContact(contactInfo);
```

## Generic methods
<!-- TODO: explain what are the most specific x more generic methods -->

## License
