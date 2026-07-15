/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

import { describe, expect, it } from 'vitest'

import { search } from '../src/fuzzybear'

describe( 'long text examples', () => {
    const BIO_EXCERPT = {
        id: 'bio',
        label: `
            The films he has directed have ranged across a wide variety of genres,
            for both adults and families. Zemeckis's films are characterized by
            an interest in state-of-the-art special effects, including the
            early use of insertion of computer graphics into live-action footage
        `,
    }

    const DUAL_OCCUR_EXCERPT = {
        id: 'dual',
        label: `
            Robert Lee Zemeckis born May 14, 1951 is an American film director, film
            producer, and screenwriter who is frequently credited as an innovator
            in visual effects. Zemeckis first attended Northern Illinois University
            in DeKalb, Illinois, and gained early experience in film as a film cutter
            for NBC News in Chicago during a summer break.
        `,
    }

    const MULTI_OCCUR_EXCERPT = {
        id: 'multi',
        label: `
            At USC Zemeckis met a fellow student, writer Bob Gale. Zemeckis came
            to the attention of Steven Spielberg. Spielberg became Zemeckis's
            mentor and executive produced his first two films, both of which Gale
            and Zemeckis co-wrote.
        `,
    }

    const ALICE_EXCERPT = {
        id: 'alice',
        label: `
            Down, down, down. There was nothing else to do, so Alice soon began
            talking again. 'Dinah'll miss me very much to-night, I should think!'
            (Dinah was the cat.) 'I hope they'll remember her saucer of milk at
            tea-time. Dinah my dear! I wish you were down here with me!
        `,
    }

    const GATSBY_EXCERPT = {
        id: 'gatsby',
        label: `
             In my younger and more vulnerable years my father gave me some advice
             that I’ve been turning over in my mind ever since. “Whenever you feel
             like criticizing anyone,” he told me, “just remember that all the
             people in this world haven’t had the advantages that you’ve had.”
        `,
    }

    const matches = [
        BIO_EXCERPT,
        DUAL_OCCUR_EXCERPT,
        ALICE_EXCERPT,
        MULTI_OCCUR_EXCERPT,
        GATSBY_EXCERPT,
    ]

    it( 'are scored correctly with a single word search term', () => {
        const results = search( 'Zenekis', matches )
        expect( results.map( e => e.id ) ).toEqual( [ 'multi', 'dual', 'bio', 'alice', 'gatsby' ] )
    } )

    it( 'ranks excerpts by how often the search term occurs in them', () => {
        const results = search( 'Zenekis', matches )
        // 'Zemeckis' appears 4x in multi, 2x in dual and 1x in bio.
        expect( results.slice( 0, 3 ).map( e => e.id ) ).toEqual( [ 'multi', 'dual', 'bio' ] )
    } )

    it( 'are scored correctly with a multi word search term', () => {
        const results = search( 'father advice Zenekis', matches )
        expect( results.map( e => e.id ) ).toEqual( [ 'bio', 'multi', 'gatsby', 'dual', 'alice' ] )
    } )
} )
