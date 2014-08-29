node-pazpar2
============

An implementation of the Pazpar2 API for Node.js using `q` promises.

**Current version: 0.1.0**

## Installation

`npm install node-pazpar2 --save`

## Usage

```javascript
var pz2 = require('pazpar2');

// To initialize a session
pz2.init().then(function() {
    console.log('Initialized session %s', pz2.session);
});

```

## Tests

`npm test`

## Release History

* 0.1.0 Initial release