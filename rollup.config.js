import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import { glob } from 'glob'
import path from 'node:path'
import { string } from 'rollup-plugin-string'
import resolve from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'

const workerDir = 'src/workers';
const files = glob.sync('**/*.ts', { cwd: workerDir });
const workerBundles = files.map(file => {
  const filePath = path.join(workerDir, file);
  return {
    input: filePath,
    output: {
      file: `lib/workers/${file.replace(/\.ts$/, '.js')}`,
      format: 'umd',
      exports: 'named',
    },
    context: 'self',
    plugins: [
      json(),
      typescript(),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.mjs','.js','.cjs']
      }),
      commonjs(),
      nodePolyfills(),
    ]
  };
})


export default [
  ...workerBundles,
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
      string({
        include: ['./lib/workers/**/*.js'],
      }),
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
