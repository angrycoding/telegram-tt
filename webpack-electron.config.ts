import fs from 'fs';
import path from 'path';
import { EnvironmentPlugin, DefinePlugin } from 'webpack';
import animatedBackgrounds from './animatedBackgrounds.json'
import { PRODUCTION_URL } from './src/config';

// GitHub workflow uses an empty string as the default value if it's not in repository variables, so we cannot define a default value here
process.env.BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const ANIMATED_BACKGROUNDS = animatedBackgrounds.map(bg => ({
  ...bg,
  slug: JSON.stringify(bg)
}))

const {
  APP_ENV = 'production',
  BASE_URL,
} = process.env;

export default {
  mode: 'production',

  target: 'node',

  entry: {
    electron: './src/electron/main.ts',
    preload: './src/electron/preload.ts',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  plugins: [
    new EnvironmentPlugin({
      APP_ENV,
      BASE_URL,
      IS_PREVIEW: false,
    }),

    new DefinePlugin({
      ANIMATED_BACKGROUNDS: JSON.stringify(ANIMATED_BACKGROUNDS),
      FOLDER_ICONS: JSON.stringify(
        fs.readdirSync(path.resolve(__dirname, 'public/folder-icons'))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .filter(name => name.endsWith('.png'))
        .map(name => `/folder-icons/${name}`)
      ),
    })
  ],

  module: {
    rules: [{
      test: /\.(ts|tsx|js)$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }],
  },

  externals: {
    electron: 'require("electron")',
  },
};
