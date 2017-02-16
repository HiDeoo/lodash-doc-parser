# Lodash Doc Parser

[Node.js](https://nodejs.org) CLI tool fetching & parsing the latest [Lodash documentation](https://github.com/lodash/lodash/blob/master/doc/README.md) in order to generate a JSON representation.

The generated JSON will only contains Lodash methods.

## Installation

Clone the repository and install the dependencies:

```
npm install
```

## Usage

Use the following command:

```
npm run start
```

The JSON representation will be saved in a `lodash.json` file.

## Configuration

The configuration is made directly in the `index.js` file using 2 variables located at the top of the file:

* **kDocUrl** (`string`): Lodash documentation URL.
* **kBlacklistedMethods** (`Array<string>`): List of blacklisted Lodash methods to exclude from the JSON representation.

## Format

The JSON representation generated is an array of objects. Each object represents a Lodash method and contains the following properties:

* **name** (`string`): Name of the Lodash method.
* **description** (`string`): Description of the Lodash method.
* **args** (`Array<string>`): List of the method arguments. If the method takes no argument, the array will be empty.
* **returns** (`string`): Returns value of the Lodash method.
* **url** (`string`): Direct URL to the Lodash method documentation.

```
[
  {
    "name": "chunk",
    "description": "Creates an array of elements split into groups the length of size. If array can't be split evenly, the final chunk will be the remaining elements.",
    "args": [
      "array",
      "[size=1]"
    ],
    "returns": "(Array)",
    "url": "https://lodash.com/docs/4.16.4#chunk"
  },
  ...
]
```

## Credits

[Lodash](https://github.com/lodash/lodash/)

## Copyright and license

Copyright (c) 2016 HiDeoo. Code released under the [MIT license](LICENSE.md).
