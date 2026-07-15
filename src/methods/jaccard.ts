/**
 *  Jaccard index, also known as the Jaccard similarity coefficient, is a statistic used
 *  for gauging the similarity and diversity of sample sets.
 *
 * @author Subhajit Sahu
 * @author Itay Grudev
 * @copyright (c) 2020 Subhajit Sahu
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

export interface JaccardParams {
    /** Minimum ngram length. Defaults to 2. */
    n?: number
}

const DEFAULT_PARAMS: Required<JaccardParams> = {
    n: 2,
}

/**
 * Calculates the Jaccard distance between two strings.
 * @param a
 * @param b
 * @param params Parameters for the similarity calculation
 * @returns Distance, normalized between 0 and 1, where 0 is an exact match
 */
export default function distance( a: string, b: string, params?: JaccardParams ): number {
    const { n } = { ...DEFAULT_PARAMS, ...params }

    // Exit early if either string is empty
    if( a.length === 0 || b.length === 0 ) return 1

    // Exit early if they're an exact match.
    if( a === b ) return 0

    const ga = Math.max( a.length - n + 1, 0 )
    const gb = Math.max( b.length - n + 1, 0 )
    const G = ga + gb
    const g = matchingNgramCount( a, b, n )

    return G ? 1 - g / ( G - g ) : 1
}

/**
 * Counts the ngrams of length `n` that occur in both `a` and `b`.
 *
 * Occurrences are consumed: an ngram present once in `a` can be matched at most once by
 * `b`, so a repeated ngram in `b` cannot be credited against a single occurrence in `a`.
 */
function matchingNgramCount( a: string, b: string, n: number ): number {
    const ngrams = new Map<string, number>()
    let count = 0

    for( let i = 0, I = a.length - n + 1; i < I; ++i ){
        const g = a.slice( i, i + n )
        ngrams.set( g, ( ngrams.get( g ) ?? 0 ) + 1 )
    }

    for( let i = 0, I = b.length - n + 1; i < I; ++i ){
        const g = b.slice( i, i + n )
        const remaining = ngrams.get( g )
        if( remaining ){
            ++count
            ngrams.set( g, remaining - 1 )
        }
    }

    return count
}
