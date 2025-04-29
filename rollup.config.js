import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'lib/cjs',
        format: 'cjs',
        exports: 'named'
      },
      {
        dir: 'lib/esm',
        format: 'es',
        exports: 'named'
      }
    ],
    plugins: [
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json'
      })
    ]
  },
  {
    input: 'lib/esm/index.d.ts',
    output: {
      file: 'lib/index.d.ts',
      format: 'es'
    },
    plugins: [dts.default()]
  }
]
