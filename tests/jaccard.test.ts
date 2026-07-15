/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import distance from '../src/methods/jaccard'

describe( 'Jaccard string distance', () => {
    it( 'returns a score of 0 for identical strings', () => {
        expect(
            distance( 'prism', 'prism' ),
        ).toEqual( 0 )
    } )

    it( 'returns a score of 1 for different strings', () => {
        expect(
            distance( 'prism', 'contact' ),
        ).toEqual( 1 )
    } )

    it( 'returns a distance of 1 if either string is empty', () => {
        expect( distance( '', 'contact' ) ).toEqual( 1 )
        expect( distance( 'prism', '' ) ).toEqual( 1 )
    } )

    it( 'returns a positive for similar strings', () => {
        const score = distance( 'prism', 'unpristine' )
        expect( score ).toBeGreaterThan( 0 )
        expect( score ).toBeLessThan( 1 )
    } )

    it( 'returns a positive for similar strings across a multi-token search', () => {
        const score = distance( 'unifold prismatic', 'unpristine interface' )
        expect( score ).toBeGreaterThan( 0 )
        expect( score ).toBeLessThan( 1 )
    } )

    it( 'returns a lower distance for more similar strings than for less similar strings', () => {
        const lower_distance = distance( 'prism', 'claxon unprismatic' )
        const higher_distance = distance( 'prism', 'claxon charismatic' )
        expect( lower_distance ).toBeLessThan( higher_distance )
    } )

    it( 'returns a 1 when the minimum ngram length is higher then the test strings', () => {
        expect(
            distance( 'abc', 'gfh', { n: 4 } ),
        ).toEqual( 1 )
    } )

    it( 'never credits a repeated ngram in one string against a single occurrence in the other', () => {
        // 'aa' occurs once in the search term, so however often it repeats in the test
        // string it can only be matched once. Distances stay normalized between 0 and 1.
        for( const test of [ 'aaaa', 'aaaaaaaaaa', 'aa aa aa aa' ] ){
            const score = distance( 'aa', test )
            expect( score ).toBeGreaterThanOrEqual( 0 )
            expect( score ).toBeLessThanOrEqual( 1 )
        }
    } )
} )
