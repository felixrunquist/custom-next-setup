import path from 'path';
// import { BASE_URL } from './lib/constants.mjs';
import { fileURLToPath } from 'url';

import createBundleAnalyzer from '@next/bundle-analyzer'

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const withBundleAnalyzer = createBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})

//Disable telemetry collection for privacy
process.env.NEXT_TELEMETRY_DISABLED = 1;

function composePlugins(plugins, config) {
    for (var i of plugins) {
        config = i(config)
    }
    return config;
}

const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    sassOptions: {
        includePaths: [path.join(__dirname, 'css'), path.join(__dirname, 'components')],
    },
    images: {
        domains: [
        ]
    }
}

if (process.env.STANDALONE) {
    nextConfig.output = 'standalone';
}

export default composePlugins([withBundleAnalyzer], nextConfig);
