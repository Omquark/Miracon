/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    eslint: {
        dirs: ["src"],
        ignoreDuringBuilds: true,
    }
}

module.exports = nextConfig