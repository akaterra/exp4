const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/ui/index.tsx',
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/i,
                exclude: /node_modules/,
                use: [ 'style-loader', 'css-loader' ],
            },
            {
                test: /normalize\.css$/i,
                include: /node_modules\/normalize\.css/,
                use: [ 'style-loader', 'css-loader' ],
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    configFile: "tsconfig.ui.json"
                },
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: 'html-loader',
            },
        ],
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/ui'),
        publicPath: '/',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'src/ui/public/assets'), to: 'assets' }
            ]
        }),
        new HtmlWebPackPlugin({
            template: './src/ui/public/index.html',
            filename: './src/ui/index.html'
        }),
    ],
    resolve: {
        extensions: [ '.wasm', '.ts', '.tsx', '.mjs', '.cjs', '.js', '.json', '.css', '.png' ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist/ui'),
        },
        compress: true,
        allowedHosts: 'all',
        port: 9002,
        historyApiFallback: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5002',
                logLevel: 'debug'
            }
        }
    },
}