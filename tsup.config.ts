import { defineConfig } from 'tsup'

export default defineConfig( {
    entry: [ 'src/fuzzybear.ts' ],
    format: [ 'esm', 'cjs' ],
    // Declarations are emitted by tsc itself (see the `build` script). tsup's bundled
    // rollup-plugin-dts still reaches for TypeScript 5 internals and cannot read a
    // TypeScript 7 program.
    dts: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2022',
} )
