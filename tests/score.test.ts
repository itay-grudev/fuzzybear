/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import { score } from '../src/fuzzybear'

describe( '#score', () => {
    it( 'returns 0 for unrelated strings', () => {
        expect(
            score( 'prism', 'contact' ),
        ).toEqual( 0 )
    } )

    it( 'returns 1 for identical strings', () => {
        expect(
            score( 'prism', 'prism' ),
        ).toEqual( 1 )
    } )

    it( 'returns the positive number for similar strings', () => {
        const distance = score( 'prism', 'unpristine' )
        expect( distance ).toBeGreaterThan( 0 )
        expect( distance ).toBeLessThan( 1 )
    } )
} )
