"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function HomePage() {
  const { authUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && authUser) {
      router.push("/home")
    }
  }, [authUser, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🀄</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">麻雀戦績管理</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            友人と一緒にリアルタイムで戦績を記録・共有し、統計分析で上達を目指そう
          </p>
        </div>

        {/* 機能紹介 */}
        <div className="grid gap-6 mb-12">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">📊</span>
                リアルタイム記録
              </CardTitle>
              <CardDescription>4桁のルームコードで即座に参加。複数人で同時に戦績を入力・共有</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-600">📈</span>
                統計分析
              </CardTitle>
              <CardDescription>平均順位、和了率、放銃率など詳細な統計で自分の打ち筋を分析</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">👥</span>
                グループ管理
              </CardTitle>
              <CardDescription>友人グループでの長期戦績管理と比較分析が可能</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* アクションボタン */}
        <div className="space-y-4 max-w-sm mx-auto">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
            <Link href="/guest">ゲストで使ってみる</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-green-600 text-green-600 hover:bg-green-50 py-6 text-lg bg-transparent"
          >
            <Link href="/login">ログイン</Link>
          </Button>

          <Button asChild variant="outline" className="w-full py-6 text-lg bg-transparent">
            <Link href="/signup">新規登録</Link>
          </Button>
        </div>

        {/* フッター */}
        <footer className="mt-16 text-center text-sm text-gray-500 space-y-2">
          <div className="flex justify-center gap-4">
            <Link href="/guide" className="hover:text-green-600">
              利用ガイド
            </Link>
            <Link href="/faq" className="hover:text-green-600">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-green-600">
              利用規約
            </Link>
          </div>
          <p>&copy; 2024 麻雀戦績管理. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
