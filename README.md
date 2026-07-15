Fuzzybear - short string search
===============================

[![npm version](https://badge.fury.io/js/fuzzybear.svg)](https://badge.fury.io/js/fuzzybear)
[![Tests](https://github.com/itay-grudev/fuzzybear/actions/workflows/tests.yml/badge.svg)](https://github.com/itay-grudev/fuzzybear/actions/workflows/tests.yml)
[![CodeQL](https://github.com/itay-grudev/fuzzybear/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/itay-grudev/fuzzybear/actions/workflows/codeql-analysis.yml)

Fuzzybear is a TypeScript library for fuzzy string search with a special focus on short strings. It is designed to use
multiple string distance functions (including custom) but by default it uses a combination of Jaro-Winkler and Jaccard
string distances. The former favours matches from the beginning of a string, while the latter splits the string into
tokens and analyses those. Together these provide a reasonable performance for  most cases, but the library allows the
user to customise the methods and parameters for searching.

![Fuzzy bear](https://raw.githubusercontent.com/itay-grudev/fuzzybear/main/fuzzybear.jpg "Cute Fuzzy Bear")

Installation
------------

```sh
npm install fuzzybear
```

The package ships type declarations and is published as both ESM and CommonJS:

```js
import { search, score } from 'fuzzybear'       // ESM
const { search, score } = require( 'fuzzybear' ) // CommonJS
```

Usage
-----

### Subset Search

`search` is the primary method used for searching. It accepts either a string array or an object array where
each element contains a key `label`.

```js
let matches = [ 'Identical', 'Identifier', 'dentical', 'Dental', 'dentist', 'different' ]
// OR
let matches = [
    { label: 'Identical', id: 's0' },
    { label: 'Identifier', id: 's1' },
    { label: 'dentical', id: 's2' },
    { label: 'Dental', id: 's3' },
    { label: 'dentist', id: 's4' },
    { label: 'Different', id: 's5' },
]
search( 'Identical', matches )
```

Each result is the original element with a `_score` added, sorted by descending score, where `1` is an exact match.

You can also restrict the number of results returned:

```js
search( 'Identical', matches, { results: 3 })
```

### Manual scoring
```js
score( 'prism', 'contact' )    // => 0
score( 'prism', 'prism' )      // => 1
score( 'prism', 'unpristine' ) // => 0.56
```

### Advanced usage

#### Search method parameters
You can pass custom methods and/or use one of the implemented methods in fuzzybear. You can also specify certain method
parameters to override the method's behaviour. For example, you can use a minimum of 3 letter substring matches in the
Jaccard search method to ignore matches with less than 3 letters.

```js
search( 'Identical', matches, {
    methods: [
        {
            name: 'jaccard',
            params: { n: 3 } // Minimum ngram length
        }
    ]
})
```

#### Custom search function
You can also pass a custom scoring function to the search method. The function takes 3 parameters: the search term, the 
target string and the method parameters. The function should return a number between 0 and 1, where 0 is a perfect match
(meaning the string distance is 0).

```js
search( 'asd', [ 'a', 'b', 'c', 'd' ], {
    methods: [
        {
            name: 'match-all',
            function: function( _a, _b, _params ){
                return 0.36
            }
        }
    ]
})
```

Methods may also be given in shorthand — as a bare name or a bare function, each of which defaults to a weight of `1`:

```js
search( 'term', matches, { methods: [ 'jaro_winkler', 'jaccard' ] })
search( 'term', matches, { methods: [ ( a, b ) => 0.8 ] })
```

## API

```ts
search( term, elements, options? ): SearchResult[] // Fuzzy string search across a list of elements.
score( term, testString, options? ): number        // Fuzzy string comparison of two strings.
```

### Configuration options

```ts
interface Options {
    results?: number       // Number of results to return. Defaults to 0 - all elements distanced
    labelField?: string    // Field to search against. Defaults to "label"
    caseSensitive?: boolean // Whether to perform a case sensitive match. Defaults to false
    minScore?: number      // Minimum score of matches to be included in the results
    methods?: MethodSpec[] // Which methods to use when scoring matches
}

// A method may be a built-in name, a bare distance function, or a definition object
type MethodSpec = string | DistanceFunction | MethodDefinition

interface MethodDefinition {
    name?: string               // Name of a built-in search algorithm, or a label for a custom one
    function?: DistanceFunction // A custom search algorithm. Takes precedence over `name`
    weight?: number             // Search algorithm weight in scoring. Defaults to 1
    params?: unknown            // Search algorithm parameters
}

// Returns a distance normalized between 0 and 1, where 0 is an exact match —
// the inverse of the score reported by search() and score()
type DistanceFunction = ( a: string, b: string, params?: any ) => number
```

Passing an unsupported method name throws `Unsupported search method: <name>`.

## Upgrading from 1.x

Fuzzybear is now written in TypeScript and ships its own type declarations. `search` and `score` keep the same
signatures, so most callers need no change.

Two things did change:

* **Scores have shifted.** The Jaccard method previously credited a repeated ngram in the test string multiple times
  against a single occurrence in the search term, which could push a distance outside its documented `0..1` range and let
  a string with a repeated token outrank an exact match. Occurrences are now consumed correctly. Absolute scores differ
  slightly and result ordering can change for longer text — if you persist scores or assert on exact orderings, re-check
  them.
* **Unsupported method names now throw.** Previously they failed later with a `TypeError`.

## PR's accepted for:

* Search methods that support longer text and using a tokenised approach (and maybe even re-using the standard string distance methods).
* Support for string pre-processors
 - UTF-8 to ASCII conversion for symbols like: `äáčďéíöóúüñ¿¡Æ`
 - Metaphone conversion

License
-------

All code and documentation are licensed under the MIT license, although permission is not granted for using this code
as a sample data for training machine learning networks.
