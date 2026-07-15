/**
 * Transliterates a string to ASCII: accents are folded onto their base letter, and Latin
 * ligatures, special letters and common punctuation are mapped to ASCII equivalents.
 *
 * Intended as a preprocessor so that searches match across accented and unaccented
 * spellings, e.g. `Munchen` against `München` or `senor` against `señor`.
 *
 * @author Itay Grudev
 * @copyright (c) 2026 Itay Grudev
 * @license MIT
 */

/**
 * Characters that do not decompose into a base letter plus combining marks, and so are
 * not handled by NFD normalization. Ligatures and special letters map to their
 * conventional ASCII spelling; punctuation maps to its ASCII counterpart.
 */
const OVERRIDES: Record<string, string> = {
    // Ligatures and special Latin letters
    'Æ': 'AE', 'æ': 'ae',
    'Œ': 'OE', 'œ': 'oe',
    'Ø': 'O', 'ø': 'o',
    'ß': 'ss', 'ẞ': 'SS',
    'Ł': 'L', 'ł': 'l',
    'Đ': 'D', 'đ': 'd',
    'Ð': 'D', 'ð': 'd',
    'Þ': 'TH', 'þ': 'th',
    'İ': 'I', 'ı': 'i',
    'Ħ': 'H', 'ħ': 'h',
    'Ŋ': 'NG', 'ŋ': 'ng',
    'Ĳ': 'IJ', 'ĳ': 'ij',

    // Punctuation and symbols
    '¿': '?', '¡': '!',
    '“': '"', '”': '"', '„': '"', '«': '"', '»': '"',
    '‘': '\'', '’': '\'', '‚': '\'',
    '–': '-', '—': '-', '―': '-',
    '…': '...',
    '·': '.',
}

/** Matches the combining marks left behind by NFD decomposition (accents, cedillas, …). */
const COMBINING_MARKS = /\p{Diacritic}/gu

/**
 * Folds a string to ASCII.
 *
 * @param input
 * @returns The input with accents stripped and non-ASCII Latin letters and punctuation
 *  mapped to ASCII. Characters with no mapping (e.g. other scripts) are passed through
 *  unchanged.
 */
export default function transliterate( input: string ): string {
    // Decompose accented letters into base + combining marks, then drop the marks.
    const stripped = input.normalize( 'NFD' ).replace( COMBINING_MARKS, '' )

    let result = ''
    for( const char of stripped )
        result += OVERRIDES[char] ?? char

    return result
}
