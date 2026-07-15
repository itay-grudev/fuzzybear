/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import { search, type MethodSpec } from '../src/fuzzybear'

describe( 'labelField', () => {
    it( 'is set to "label" by default', () => {
        expect(
            search(
                'col',
                [
                    { label: 'Mars Bar', id: 'mars' },
                    { label: 'Chocolate', id: 'choc' },
                ] )[0].id,
        ).toEqual( 'choc' )
    } )

    it( 'allows setting arbitrary labels', () => {
        expect(
            search(
                'col',
                [
                    { bar: 'Mars Bar', id: 'mars' },
                    { bar: 'Chocolate', id: 'choc' },
                ], {
                    labelField: 'bar',
                } )[0].id,
        ).toEqual( 'choc' )
    } )
} )

describe( 'method shorthand', () => {
    it( 'name', () => {
        expect(
            search( 'term', [ 'terminus', 'exterminator' ], {
                methods: [ 'jaro_winkler', 'jaccard' ],
            } ).map( e => Math.round( e._score * 10 ) / 10 ),
        ).toEqual( [ 0.7, 0.5 ] )
    } )

    it( 'custom', () => {
        expect(
            search( 'term', [ 'terminus', 'exterminator' ], {
                methods: [ () => 0.8 ],
            } ).map( e => Math.round( e._score * 10 ) / 10 ),
        ).toEqual( [ 0.2, 0.2 ] )
    } )

    it( 'invalid', () => {
        expect(
            () => {
                // Methods given as neither a name, a function nor a definition object.
                // Cast so that a JavaScript caller's mistake can be exercised from
                // TypeScript, where the type system would otherwise reject it.
                search( 'term', [ 'terminus', 'exterminator' ], {
                    methods: [ 1, 3, 2 ] as unknown as MethodSpec[],
                } ).map( e => Math.round( e._score * 10 ) / 10 )
            },
        ).toThrow( 'Invalid method definition' )
    } )

    it( 'unsupported name', () => {
        expect(
            () => {
                search( 'term', [ 'terminus' ], { methods: [ 'levenshtein' ] } )
            },
        ).toThrow( 'Unsupported search method: levenshtein' )

        expect(
            () => {
                search( 'term', [ 'terminus' ], { methods: [ { name: 'levenshtein' } ] } )
            },
        ).toThrow( 'Unsupported search method: levenshtein' )
    } )
} )
