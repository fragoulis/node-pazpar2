pazpar2
============

An implementation of the Pazpar2 API for Node.js using `q` promises.

## Installation

`npm install pazpar2 --save`

## Usage

To initialize a session:
```javascript
var pz2 = require('pazpar2');

pz2.init().then(function() {
    console.log('Initialized session %s', pz2.session);
});

```

## Methods

Name | Returns | Description
---- | :-----: | -----------
init | q.Promise | Initializes a session
safeInit | q.Promise | Guarantees a valid session on return
ping | q.Promise | 
search | q.Promise | 
stat | q.Promise | 
termlist | q.Promise | 
show | q.Promise | 
record | q.Promise | 

## Tests

`npm test`

## Release History

* 0.1.2
 * Removed empty closures
* 0.1.1
 * Removed the custom structured objects for `stat`, `show` and `termlist`.
* 0.1.0
 * Initial release