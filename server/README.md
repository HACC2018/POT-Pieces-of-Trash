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
| `/locations` | `GET`  |                                                                                                | a list of locations recorded                                                                               |
| `/locations` | `POST` | `{'location': 'Bilger'}`                                                                       | `{'ok': true}`                                                                                             |
| `/pie`       | `GET`  |                                                                                                | a json object containing a map of dates and locations for options, location can be `all` for aggregation.
| `/pie`       | `POST` | `{'location': 'Bilger', 'timestamp': 1540980023}` (location and timestamp in epoch seconds)    | `{ "location": "bilger",     "timestamp": 1541066400,     "unit": "lb",     "wastes": {         "cans": 34,         "forks": 28,         "knifes": 44,         "paper": 33,         "paper cups": 26,        "starbucks": 34,         "straws": 33     } }`
| `/timeseries`| `POST` | `{	"lowerbound": 1541032618,	"upperbound": 1541072618,	"location": ["keller", "bilger"], "waste-types": "all" }` (lowerbound is the lowerbound time, uppoerbound is upperbound time, location can be a list of location names or `all` as a string, waste-types can be a list of wastes or `all` as a string) | `{     "x": [        1540980000,         1541066400      ],     "y": [         {            "data": [                 393,                 108            ],            "location": "keller",            "waste": "all"        },        {            "data": [           "",                232            ],            "location": "bilger",            "waste": "all"        }    ]}` or if the waste is a list `{"x":[1540980000,1541066400],"y":[{"data":[73,25],"location":"keller","waste":"paper cups"},{"data":[57,7],"location":"keller","waste":"straws"},{"data":["",26],"location":"bilger","waste":"paper cups"},{"data":["",33],"location":"bilger","waste":"straws"}]}`
| `/waste-types` | `GET` |                                                                                               | `{"waste-types:":["starbucks","paper cups","straws","forks","knifes","paper","cans"]}`
