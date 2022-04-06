const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: "./src/main.tsx",
    output: {
        filename: "bundle.js",
        path: __dirname + "/public",
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                ],
            },
        ],
    },
    plugins: [new MiniCssExtractPlugin({
        filename: "style.css",
    })],
};
