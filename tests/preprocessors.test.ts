/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import { score, search, type PreprocessorSpec } from '../src/fuzzybear'

describe( 'preprocessors', () => {
    it( 'are not applied by default, so accents do not match', () => {
        expect( score( 'Munchen', 'München' ) ).toBeLessThan( 1 )
    } )

    it( 'fold accents on both sides with the transliterate built-in', () => {
        expect(
            score( 'Munchen', 'München', { preprocessors: [ 'transliterate' ] } ),
        ).toEqual( 1 )
        expect(
            score( 'señor', 'senor', { preprocessors: [ 'transliterate' ] } ),
        ).toEqual( 1 )
    } )

    it( 'let an accented candidate match an unaccented search term exactly', () => {
        const places = [ 'München', 'Zürich', 'Malmö', 'Kraków' ]
        const result = search( 'Malmo', places, { preprocessors: [ 'transliterate' ] } )
        expect( result[0].label ).toEqual( 'Malmö' )
        expect( result[0]._score ).toEqual( 1 )
    } )

    it( 'accept a custom function', () => {
        const stripPunctuation: PreprocessorSpec = ( s ) => s.replace( /[^a-z0-9]/gi, '' )
        expect(
            score( 'ab-cd', 'abcd', { preprocessors: [ stripPunctuation ] } ),
        ).toEqual( 1 )
    } )

    it( 'are applied in order', () => {
        const calls: string[] = []
        const first: PreprocessorSpec = ( s ) => { calls.push( 'first' ); return s }
        const second: PreprocessorSpec = ( s ) => { calls.push( 'second' ); return s }
        score( 'a', 'b', { preprocessors: [ first, second ] } )
        // Two strings are preprocessed, each through both steps, first then second.
        expect( calls ).toEqual( [ 'first', 'second', 'first', 'second' ] )
    } )

    it( 'run before case folding', () => {
        // A preprocessor that only maps the uppercase form still matches a lowercase
        // search term, because case folding happens afterwards.
        const mapAE: PreprocessorSpec = ( s ) => s.replace( /Æ/g, 'AE' )
        expect(
            score( 'aether', 'Æther', { preprocessors: [ mapAE ] } ),
        ).toEqual( 1 )
    } )

    it( 'still fold case when caseSensitive is false', () => {
        expect(
            score( 'MÜNCHEN', 'münchen', { preprocessors: [ 'transliterate' ] } ),
        ).toEqual( 1 )
    } )

    it( 'yield a score of 0 when a preprocessor empties both strings', () => {
        const digitsOnly: PreprocessorSpec = ( s ) => s.replace( /\d/g, '' )
        expect(
            score( '123', '456', { preprocessors: [ digitsOnly ] } ),
        ).toEqual( 0 )
    } )

    it( 'raise an exception for an unsupported preprocessor name', () => {
        expect(
            () => score( 'a', 'b', { preprocessors: [ 'metaphone' ] } ),
        ).toThrow( 'Unsupported preprocessor: metaphone' )
    } )

    it( 'raise an exception for an invalid preprocessor definition', () => {
        expect(
            () => score( 'a', 'b', { preprocessors: [ 42 ] as unknown as PreprocessorSpec[] } ),
        ).toThrow( 'Invalid preprocessor definition' )
    } )
} )
