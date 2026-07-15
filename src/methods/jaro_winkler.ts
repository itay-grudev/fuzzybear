/**
 * The Jaro–Winkler distance uses a prefix scale `p` which gives more favourable ratings
 * to strings that match from the beginning for a set prefix length `ℓ`.
 *
 * The higher the Jaro–Winkler similarity for two strings is - the more similar the strings
 * are. The score is normalized such that 1 means an exact match and 0 means there is no
 * similarity. The original paper actually defined the metric in terms of similarity, so
 * the distance is defined as the inversion of that value (distance = 1 − similarity).
 *
 * @author Jordan Thomas
 * @author Itay Grudev
 * @copyright (c) 2015 Jordan Thomas
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

export interface JaroWinklerParams {
    /**
     * Constant scaling factor for how much the score is adjusted upwards for having
     * common prefixes. Defaults to 0.1.
     */
    p?: number
}

const DEFAULT_PARAMS: Required<JaroWinklerParams> = {
    p: 0.1,
}

/** Maximum common prefix length considered by the Winkler adjustment. */
const MAX_PREFIX_LENGTH = 4

/** Winkler's prefix bonus only applies to strings that already pass this threshold. */
const PREFIX_BONUS_THRESHOLD = 0.7

/**
 * Calculates the Jaro-Winkler distance between two strings.
 * @param a
 * @param b
 * @param params Parameters for the similarity calculation
 * @returns Distance, normalized between 0 and 1, where 0 is an exact match
 */
export default function distance( a: string, b: string, params?: JaroWinklerParams ): number {
    const { p } = { ...DEFAULT_PARAMS, ...params }

    // Exit early if either string is empty
    if( a.length === 0 || b.length === 0 ) return 1

    // Exit early if the strings are an exact match.
    if( a === b ) return 0

    let i: number
    let j = 0
    let m = 0

    const range = Math.floor( Math.max( a.length, b.length ) / 2 ) - 1
    const aMatch = new Array<boolean>( a.length ).fill( false )
    const bMatch = new Array<boolean>( b.length ).fill( false )

    for( i = 0; i < a.length; i++ ){
        const low = ( i >= range ) ? i - range : 0
        const high = ( i + range <= ( b.length - 1 ) ) ? ( i + range ) : ( b.length - 1 )
        for( j = low; j <= high; j++ ){
            if( ! aMatch[i] && ! bMatch[j] && a[i] === b[j] ){
                ++m
                aMatch[i] = bMatch[j] = true
                break
            }
        }
    }

    // Exit early if no matches were found.
    if( m === 0 ) return 1

    // Count the transpositions.
    let k = 0
    let numTrans = 0
    for( i = 0; i < a.length; i++ ){
        if( aMatch[i] ){
            for( j = k; j < b.length; j++ ){
                if( bMatch[j] ){
                    k = j + 1
                    break
                }
            }
            // `j` intentionally carries out of the loop above: when no further matched
            // character remains in `b` it lands past the end and the comparison counts a
            // transposition.
            if( a[i] !== b[j] ) ++numTrans
        }
    }

    let weight = ( m / a.length + m / b.length + ( m - ( numTrans / 2 ) ) / m ) / 3

    if( weight > PREFIX_BONUS_THRESHOLD ){
        let l = 0
        while( a[l] === b[l] && l < MAX_PREFIX_LENGTH ) ++l
        weight += l * p * ( 1 - weight )
    }

    return 1 - weight
}
