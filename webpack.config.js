const path = require('path')
const webpack = require('webpack')
const pkg = require('./package')

const isProd = process.env.NODE_ENV === 'production'
const bundleName = `${pkg.name}-bundle${isProd ? '.min' : ''}.js`

module.exports = ({
  entry: [path.resolve(__dirname, './cli/main.js')],
  output: {
    path: path.resolve(__dirname, './assets/app'),
    filename: bundleName,
    publicPath: '/assets/app/'
  },
  resolveLoader: {
    root: [path.join(__dirname, 'node_modules')]
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }, {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }, {
        test: /\.jpg$/,
        loader: 'file-loader'
      }, {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream'
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      }, {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      }, {
        test: /\.vue$/,
        loader: 'vue',
        //exclude: /node_modules/,
        query: {
          plugins: ['lodash'],
          presets: ['es2015']
        }
      },
    ]
  },
  vue: {
    loaders: {
      js: 'babel'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({_: 'lodash'}),
  ],
  resolve: {
    alias: {
      'vue$': `vue/dist/vue${isProd ? '.min' : ''}.js`,
    }
  },
  init() {
    if (isProd) {
      this.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {warnings: false}
      }))
    } else {
      Object.assign(this, {
        devtool: '#inline-source-map',
        devServer: {inline: true},
      })
    }
    return this
  }
}).init()
