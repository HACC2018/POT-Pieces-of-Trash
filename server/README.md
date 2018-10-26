# Setup

## python environment
I am using `python 3.6.6`, anything above `python 3` should work. I am using [`virtualenv`](https://virtualenv.pypa.io/en/stable/installation/) to set up the libraries for python. 

To install all the dependencies:
1. `cd server`
2. `virtualenv -p python3 venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `python index.py` to start the server.


## database
I am using [`mongodb`](https://www.mongodb.com/download-center/community) to avoid writing queries. Before you make calls to the server make sure the daemon `mongod` has been run either as a service in the background or as a process (`mongod --dbpath <any directory to store your data>`)

## endpoints
| endpiont     | method | expect                                                                                         | result                                                                                                     |
|--------------|--------|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `/`          | `GET`  |                                                                                                | `Hello World`                                                                                              |
| `/ping`      | `GET`  |                                                                                                | `{'ok': true}`                                                                                             |
| `/analyze`    | `POST` | a `form`, see `upload_image.html` for basic usage                                              | a json object containing the count of trashes, or error message if the `POST` does not have all the fields |
| `/query`     | `GET`  | `/query?from=<epoch time>&to=<epoch time>&location=<building name>`. All 3 fields are optional | a json object containing the data collected since `from` until `to` (inclusive) at `location`              |
| `/locations` | `GET`  |                                                                                                | a list of locations recorded                                                                               |
| `/locations` | `POST` | `{'location': 'Bilger'}`                                                                       | `{'ok': true}`                                                                                             |

