const sass = require('sass')
const path = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

//Disable telemetry collection for privacy
process.env.NEXT_TELEMETRY_DISABLED = 1;

function composePlugins(plugins, config){
  for(var i of plugins){
    config = i(config)
  }
  return config;
}

const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'css'), path.join(__dirname, 'components')],
  },
  images: {
    domains: [
    ]
  },
  webpack: (config) => {
    return config;
  },
  // i18n: {
  //   locales: ["en"],
  //   defaultLocale: "en",
  // },
  
}

if(process.env.STANDALONE){
  nextConfig.experimental = {
    esmExternals: 'loose'
  };
  nextConfig.output = 'standalone';
}

module.exports = composePlugins([withBundleAnalyzer], nextConfig);
