# KSUID resource types

While we don't use the environment portion of the KSUID (for obvious reasons), we do use the resource. This is a listing of all the various resources used, what they represent, and where to find them.

| Resource | Description |
| -------- | ----------- |
| `project` | A Beak Project ID. |
| `jsonentry` | A unique json entry, used in the body of the rich json editor. |
| `urlencodeditem` | A url encoded form item, used in the body of the rich url encoded form editor. |
| `request` | An individual request, used in the request json files. |
| `binstore` | A value stored in the binary data store. A flight will contain a reference to this. |
| `flight` | A flight (or historical request) made by Beak. |
| `query` | A query item, used in the request info. |
| `header` | A header item, used in the request info. |
| `item` | An item in a variable group. Closely related to `group`. |
| `group` | A group in a variable group. Closely related to `item`. |
| `value` | A value linking an `item` and a `group` from a variable group. |
