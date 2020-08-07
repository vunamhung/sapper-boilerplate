const webpack = require("webpack");
const { resolve } = require("path");
const WebpackModules = require("webpack-modules");
const MiniCssExtract = require("mini-css-extract-plugin");
const config = require("sapper/config/webpack.js");
const pkg = require("./package.json");

const mode = process.env.NODE_ENV;
const dev = mode === "development";

const alias = { svelte: resolve("node_modules", "svelte") };
const extensions = [".mjs", ".js", ".json", ".svelte", ".html"];
const mainFields = ["svelte", "module", "browser", "main"];

const loaders = {
  css: {
    loader: "css-loader",
    options: {
      sourceMap: true,
    },
  },
  postCSS: {
    loader: "postcss-loader",
    options: require("./postcss.config"),
  },
  file: {
    loader: "file-loader",
    options: {
      name: "[name].[ext]",
      outputPath: "assets/fonts/",
    },
  },
};

const preprocessOptions = {
  transformers: {
    postcss: {
      plugins: [
        require("postcss-easy-import")({ prefix: "string" }),
        require("postcss-import"),
        require("postcss-each"),
        require("tailwindcss"),
        require("postcss-preset-env"),
        require("postcss-nested"),
        require("autoprefixer")({ flexbox: "no-2009" }),
      ]
    }
  }
};

module.exports = {
  client: {
    entry: config.client.entry(),
    output: config.client.output(),
    resolve: { alias, extensions, mainFields },
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              dev,
              hydratable: true,
              hotReload: false, // pending https://github.com/sveltejs/svelte/issues/2377
              preprocess: require("svelte-preprocess")(
                 preprocessOptions
              )
            },
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtract.loader, loaders.css, loaders.postCSS],
          exclude: /node_modules/,
        },
        {
          test: /\.(ttf|eot|svg|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          use: [loaders.file],
          exclude: /assets/,
        },
      ],
    },
    mode,
    plugins: [
      // pending https://github.com/sveltejs/svelte/issues/2377
      // dev && new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
    ].filter(Boolean),
    devtool: dev && "inline-source-map",
  },

  server: {
    entry: config.server.entry(),
    output: config.server.output(),
    target: "node",
    resolve: { alias, extensions, mainFields },
    externals: Object.keys(pkg.dependencies).concat("encoding"),
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              css: false,
              generate: "ssr",
              dev,
            },
          },
        },
      ],
    },
    mode,
    plugins: [new WebpackModules()],
    performance: {
      hints: false, // it doesn't matter if server.js is large
    },
  },

  serviceworker: {
    entry: config.serviceworker.entry(),
    output: config.serviceworker.output(),
    mode,
  },
};
