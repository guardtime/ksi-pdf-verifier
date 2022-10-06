const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const config = {
  entry: {
    'main': './src/viewer.js',
    'pdf.worker': 'pdfjs-dist/lib/pdf.worker.js',
  },
  module: {
    rules: [
      {
        test: /\.(m?js)$/,
        exclude: new RegExp('node_modules\\'+path.sep+'(?!@guardtime/ksi-js-api|@guardtime/gt-js-common).*'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                corejs: 3,
                targets: '> 0.25%',
                useBuiltIns: 'usage'
              }]
            ],
            plugins: ["@babel/plugin-proposal-class-properties"]
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(svg|cur|png|gif)$/i,
        use: ['file-loader'],
      },
    ]
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    modules: ['node_modules'],
    alias: {
      [path.resolve(__dirname, 'node_modules/pdfjs-dist/lib/core/annotation.js')]:
        path.resolve(__dirname, 'src/annotation.js'),
      [path.resolve(__dirname, 'node_modules/pdfjs-dist/lib/external/webL10n/l10n/')]:
        path.resolve(__dirname, 'node_modules/pdf.js/external/webL10n/l10n/')
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'index.html',
      favicon: 'favicon.ico',
      inject: 'head'
    }),
    new webpack.ExtendedAPIPlugin()
  ]
};

function addKsiTranslations(content, filePath) {
  const locale = filePath.split('/').slice(-2)[0];
  if (['et', 'en-CA', 'en-GB', 'en-US', 'en-ZA'].includes(locale)) {
    return content + fs.readFileSync(path.resolve(__dirname, 'src/locale/' + locale + '/viewer.properties'));
  }
  return content;
}

module.exports = (env, argv) => {
  const defaultConfig = process.env.PDF_CONFIG || 'static/default_configuration.json';
  if (argv.mode === 'development') {
    config.plugins.push(
        new CopyPlugin([
          { from: defaultConfig, to:"static/default_configuration.json"},
          { from: 'demo/signed.pdf', to: 'demo' },
          { from: 'node_modules/pdfjs-dist/cmaps/', to: 'cmaps' },
          { from: 'node_modules/pdf.js/l10n/', to: 'locale', transform(content, path) { return addKsiTranslations(content, path); }},
          { from: 'src/locale/locale.properties', to: 'locale'}
        ]),
    )
  }
  if (argv.mode === 'production') {
    config.plugins.push(
        new CopyPlugin([
          { from: 'static/readonly_configuration.json', to:"static/default_configuration.json"},
          { from: 'node_modules/pdfjs-dist/cmaps/', to: 'cmaps' },
          { from: 'node_modules/pdf.js/l10n/', to: 'locale', transform(content, path) { return addKsiTranslations(content, path); }},
          { from: 'src/locale/locale.properties', to: 'locale'}
        ]),
    )
  }
  return config;
};
