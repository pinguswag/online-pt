import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Online PT',
        short_name: 'Online PT',
        description: 'Personal Training Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B132B',
        theme_color: '#ccfd14',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
