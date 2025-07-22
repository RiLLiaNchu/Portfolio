import type React from "react"
import type { Metadata } from "next"
import { Inter, Noto_Serif_JP } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })
const notoSerifJP = Noto_Serif_JP({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "麻雀戦績管理",
  description: "リアルタイムで麻雀の戦績を記録・共有するアプリ",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${notoSerifJP.className} bg-gray-50`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
