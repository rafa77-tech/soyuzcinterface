/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido eslint: ignoreDuringBuilds - agora vai mostrar erros reais
  // Removido typescript: ignoreBuildErrors - agora vai capturar erros de tipo
  
  images: {
    unoptimized: true, // Mantido para compatibilidade com static export se necessário
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Configurações de segurança melhoradas
  poweredByHeader: false,
  
  // Otimizações de bundle
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
