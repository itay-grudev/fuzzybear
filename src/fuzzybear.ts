/**
 * Fuzzy string search across a list of elements with support for multiple algorithms,
 * short string search and scoring.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 * @export fuzzybear
 */

import jaccard from './methods/jaccard'
import jaro_winkler from './methods/jaro_winkler'
import transliterate from './preprocessors/transliterate'

export type { JaccardParams } from './methods/jaccard'
export type { JaroWinklerParams } from './methods/jaro_winkler'
export { default as transliterate } from './preprocessors/transliterate'

/**
 * A string distance function.
 *
 * Returns a distance normalized between 0 and 1, where 0 is an exact match. Note that
 * this is the inverse of the score reported by {@link search} and {@link score}.
 *
 * `params` is intentionally loosely typed so that custom methods may declare their own
 * parameter shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DistanceFunction = ( a: string, b: string, params?: any ) => number

/** The name of a distance method bundled with fuzzybear. Derived from {@link METHODS}. */
export type BuiltinMethodName = keyof typeof METHODS

export interface MethodDefinition {
    /** Name of a built-in search algorithm, or a label for a custom one. */
    name?: string
    /** A custom search algorithm. Takes precedence over `name`. */
    function?: DistanceFunction
    /** Search algorithm weight in scoring. Defaults to 1. */
    weight?: number
    /** Search algorithm parameters. */
    params?: unknown
}

/**
 * A method may be given as a built-in name, a bare distance function, or a full
 * definition object.
 */
export type MethodSpec = BuiltinMethodName | ( string & {} ) | DistanceFunction | MethodDefinition

/**
 * A string preprocessor. Applied to both the search term and every candidate before they
 * are scored, so both sides are always normalized the same way.
 */
export type Preprocessor = ( input: string ) => string

/** The name of a preprocessor bundled with fuzzybear. Derived from {@link PREPROCESSORS}. */
export type BuiltinPreprocessorName = keyof typeof PREPROCESSORS

/** A preprocessor may be given as a built-in name or a custom function. */
export type PreprocessorSpec = BuiltinPreprocessorName | ( string & {} ) | Preprocessor

export interface Options {
    /** Number of results to return. Defaults to 0 - all elements distanced. */
    results?: number
    /** Field to search against. Defaults to "label". */
    labelField?: string
    /** Whether to perform a case sensitive match. Defaults to false. */
    caseSensitive?: boolean
    /** Minimum score of matches to be included in the results. */
    minScore?: number
    /** Which methods to use when scoring matches. */
    methods?: MethodSpec[]
    /**
     * Preprocessors applied, in order, to both the search term and every candidate before
     * scoring. Defaults to none. Case folding (see `caseSensitive`) is applied after these.
     */
    preprocessors?: PreprocessorSpec[]
}

/** An element may be searched either as a bare string or as an object with a label. */
export type SearchElement = string | Record<string, unknown>

/** A searched element, augmented with the score it matched at. */
export type SearchResult<T extends SearchElement> =
    ( T extends string ? Record<string, string> : T ) & { _score: number }

// The bundled registries are the single source of truth for their names: the
// `Builtin*Name` types are derived from these keys, so adding an entry here is all that is
// needed to extend both the runtime lookup and the accepted names. `satisfies` keeps each
// key as a literal (a `Record<string, …>` annotation would widen them away).
const METHODS = {
    jaccard,
    jaro_winkler,
} satisfies Record<string, DistanceFunction>

const PREPROCESSORS = {
    transliterate,
} satisfies Record<string, Preprocessor>

/** A method definition after defaults have been applied and its function resolved. */
interface ResolvedMethod {
    name?: string
    function: DistanceFunction
    weight: number
    params?: unknown
}

/** Options after defaults have been applied and methods resolved. */
interface ResolvedOptions {
    results: number
    labelField: string
    caseSensitive: boolean
    minScore: number
    methods: ResolvedMethod[]
    preprocessors: Preprocessor[]
}

const DEFAULT_OPTIONS: Required<Options> = {
    results: 0,
    minScore: -Number.MAX_VALUE,
    caseSensitive: false,
    labelField: 'label',
    methods: [
        { name: 'jaro_winkler', params: { p: 0.1 }, weight: 1.5 },
        { name: 'jaccard', params: { n: 2 }, weight: 1 },
    ],
    preprocessors: [],
}

/**
 * Perform a fuzzy string search across a list of elements.
 *
 * @param searchTerm
 * @param elements Strings, or objects carrying the searched value under `labelField`
 * @param options
 * @returns The matching elements, each with a `_score`, sorted by descending score
 * @throws {Error} if a search method is not supported or an element is invalid
 */
export function search<T extends SearchElement>(
    searchTerm: string,
    elements: readonly T[],
    options: Options = {},
): SearchResult<T>[] {
    const resolved = resolveOptions( options )

    let resultSet: SearchResult<T>[] = []

    for( const element of elements as readonly SearchElement[] ){
        const value = labelOf( element, resolved.labelField )

        if( value === undefined )
            throw new Error( 'Element without label is not searchable' )

        // Convert the string only values to an object carrying the label
        const record: Record<string, unknown> = typeof element === 'string'
            ? { [resolved.labelField]: element }
            : element

        const searchScore = scoreResolved( searchTerm, value, resolved )

        if( searchScore >= resolved.minScore )
            resultSet.push( { ...record, _score: searchScore } as SearchResult<T> )
    }

    // Sort descending based on score
    resultSet.sort( ( left, right ) => right._score - left._score )

    if( resolved.results > 0 )
        resultSet = resultSet.slice( 0, resolved.results )

    return resultSet
}

/**
 * Perform a fuzzy string comparison of two strings.
 *
 * @param searchTerm
 * @param testString
 * @param options
 * @returns The score, where 1 is an exact match and 0 is no similarity
 * @throws {Error} if a search method is not supported
 */
export function score(
    searchTerm: string,
    testString: string,
    options: Options = {},
): number {
    return scoreResolved( searchTerm, testString, resolveOptions( options ) )
}

/**
 * Scores a pair of strings against already-resolved options.
 *
 * Kept separate so that {@link search} resolves its options once, rather than once per
 * element.
 */
function scoreResolved(
    searchTerm: string,
    testString: string,
    options: ResolvedOptions,
): number {
    searchTerm = preprocess( searchTerm, options )
    testString = preprocess( testString, options )

    let score = 0
    let weight = 0

    for( const method of options.methods ){
        score += ( 1 - method.function( searchTerm, testString, method.params ) ) * method.weight
        weight += method.weight
    }

    return score / weight
}

/**
 * Applies the configured preprocessors, in order, then case folding.
 *
 * Case folding runs last so that a preprocessor sees the original casing (relevant for
 * case-aware transliteration such as `Æ` → `AE`).
 */
function preprocess( input: string, options: ResolvedOptions ): string {
    for( const preprocessor of options.preprocessors )
        input = preprocessor( input )

    if( ! options.caseSensitive )
        input = input.toLowerCase()

    return input
}

function resolveOptions( options: Options ): ResolvedOptions {
    const merged = { ...DEFAULT_OPTIONS, ...options }

    // Raise an error if there are no methods specified
    if( merged.methods.length === 0 )
        throw new Error( 'No search methods specified.' )

    return {
        results: merged.results,
        labelField: merged.labelField,
        caseSensitive: merged.caseSensitive,
        minScore: merged.minScore,
        methods: merged.methods.map( resolveMethod ),
        preprocessors: merged.preprocessors.map( resolvePreprocessor ),
    }
}

/**
 * Normalizes a method shorthand into a full definition and binds its distance function.
 *
 * Does not mutate the caller's method definition.
 */
function resolveMethod( method: MethodSpec ): ResolvedMethod {
    if( typeof method === 'string' )
        return { name: method, weight: 1, function: lookupMethod( method ) }

    if( typeof method === 'function' )
        return { weight: 1, function: method }

    if( isRecord( method ) ){
        const definition = method as MethodDefinition
        const fn = definition.function ?? lookupMethod( definition.name )

        return {
            name: definition.name,
            weight: definition.weight ?? 1,
            params: definition.params,
            function: fn,
        }
    }

    throw new Error( 'Invalid method definition' )
}

function lookupMethod( name: string | undefined ): DistanceFunction {
    if( name === undefined || ! isBuiltinMethodName( name ) )
        throw new Error( `Unsupported search method: ${ String( name ) }` )

    return METHODS[name]
}

function isBuiltinMethodName( name: string ): name is BuiltinMethodName {
    return Object.hasOwn( METHODS, name )
}

/** Normalizes a preprocessor shorthand into a function. */
function resolvePreprocessor( preprocessor: PreprocessorSpec ): Preprocessor {
    if( typeof preprocessor === 'function' )
        return preprocessor

    if( typeof preprocessor === 'string' ){
        if( ! isBuiltinPreprocessorName( preprocessor ) )
            throw new Error( `Unsupported preprocessor: ${ preprocessor }` )

        return PREPROCESSORS[preprocessor]
    }

    throw new Error( 'Invalid preprocessor definition' )
}

function isBuiltinPreprocessorName( name: string ): name is BuiltinPreprocessorName {
    return Object.hasOwn( PREPROCESSORS, name )
}

/** Returns the value an element should be searched against, or undefined if it has none. */
function labelOf( element: SearchElement, labelField: string ): string | undefined {
    if( typeof element === 'string' ) return element
    if( ! isRecord( element ) ) return undefined

    const label = element[labelField]

    return typeof label === 'string' ? label : undefined
}

function isRecord( value: unknown ): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
