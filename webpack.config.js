const NpmDtsPlugin = require('npm-dts-webpack-plugin')
const path = require('path')

module.exports = {
  mode: "production",
  entry: {
    app: ['@babel/polyfill', './src/index.js']
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  },
  plugins: [
    new NpmDtsPlugin({
      logLevel: "error",
      output: "build/index.d.ts"
    })
  ]
}