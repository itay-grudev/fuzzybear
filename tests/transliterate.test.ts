/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import transliterate from '../src/preprocessors/transliterate'

describe( 'transliterate', () => {
    it( 'leaves plain ASCII unchanged', () => {
        expect( transliterate( 'hello world' ) ).toEqual( 'hello world' )
    } )

    it( 'folds accented letters onto their base letter', () => {
        expect( transliterate( 'äáčďéíöóúüñ' ) ).toEqual( 'aacdeioouun' )
        expect( transliterate( 'café' ) ).toEqual( 'cafe' )
        expect( transliterate( 'señor' ) ).toEqual( 'senor' )
    } )

    it( 'preserves case while folding', () => {
        expect( transliterate( 'Zürich' ) ).toEqual( 'Zurich' )
        expect( transliterate( 'RÉSUMÉ' ) ).toEqual( 'RESUME' )
    } )

    it( 'maps ligatures and special Latin letters to ASCII spellings', () => {
        expect( transliterate( 'Æther' ) ).toEqual( 'AEther' )
        expect( transliterate( 'straße' ) ).toEqual( 'strasse' )
        expect( transliterate( 'Øystein' ) ).toEqual( 'Oystein' )
        expect( transliterate( 'Łódź' ) ).toEqual( 'Lodz' )
        expect( transliterate( 'Þór' ) ).toEqual( 'THor' )
        expect( transliterate( 'œuvre' ) ).toEqual( 'oeuvre' )
    } )

    it( 'maps punctuation and symbols to ASCII', () => {
        expect( transliterate( '¿Qué?' ) ).toEqual( '?Que?' )
        expect( transliterate( '¡Vamos!' ) ).toEqual( '!Vamos!' )
        expect( transliterate( '“hola” – sí…' ) ).toEqual( '"hola" - si...' )
    } )

    it( 'produces pure ASCII for the whole example set', () => {
        const folded = transliterate( 'äáčďéíöóúüñ¿¡Æ' )
        expect( folded ).toEqual( 'aacdeioouun?!AE' )
        // eslint-disable-next-line no-control-regex
        expect( /^[\x00-\x7F]*$/.test( folded ) ).toBe( true )
    } )

    it( 'passes through characters it has no mapping for', () => {
        expect( transliterate( '日本語' ) ).toEqual( '日本語' )
    } )

    it( 'returns an empty string for an empty string', () => {
        expect( transliterate( '' ) ).toEqual( '' )
    } )
} )
