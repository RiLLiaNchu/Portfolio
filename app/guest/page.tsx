"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"

export default function GuestPage() {
  const [guestName, setGuestName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signInAsGuest } = useAuth()
  const router = useRouter()

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) {
      setError("お名前を入力してください")
      return
    }

    setLoading(true)
    setError("")

    try {
      await signInAsGuest(guestName.trim())
      router.push("/home")
    } catch (error: any) {
      setError(error.message || "ゲストログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-4">ゲストで利用</h1>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">👤</div>
            <CardTitle>ゲストとして参加</CardTitle>
            <CardDescription>アカウント登録なしで麻雀戦績管理をお試しいただけます</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuestLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">お名前（ニックネーム）</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="guestName"
                    type="text"
                    placeholder="例：山田太郎"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="pl-10"
                    maxLength={20}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">他の参加者に表示される名前です</p>
              </div>

              {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "ログイン中..." : "ゲストで開始"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">ゲスト利用について</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ルーム参加・対局が可能です</li>
                  <li>• データは一時的に保存されます</li>
                  <li>• ブラウザを閉じると履歴は消えます</li>
                  <li>• 長期利用には会員登録をおすすめします</li>
                </ul>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-600">継続利用をご希望の方は </span>
                <Link href="/signup" className="text-green-600 hover:underline">
                  新規登録
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
