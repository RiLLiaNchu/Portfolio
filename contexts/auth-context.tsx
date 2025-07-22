"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInAsGuest: (name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  const syncUserToDatabase = async (authUser: User) => {
    try {
      // まずテーブルが存在するかチェック
      const { data: tableCheck, error: tableError } = await supabase.from("users").select("count").limit(1)

      if (tableError) {
        console.warn("usersテーブルが存在しません。データベースセットアップが必要です:", tableError.message)
        return // テーブルが存在しない場合はスキップ
      }

      const userData = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email!.split("@")[0] || "Unknown User",
        updated_at: new Date().toISOString(),
      }

      console.log("ユーザー同期データ:", userData)

      const { error } = await supabase.from("users").upsert([userData], {
        onConflict: "id",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error("ユーザー情報同期エラー詳細:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("✅ ユーザー情報同期完了:", authUser.id)
    } catch (err: any) {
      console.error("❌ syncUserToDatabase 失敗:", {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
      })
      // エラーをthrowしない（アプリの動作を止めない）
    }
  }

  const syncGuestToDatabase = async (guestUser: User) => {
    try {
      // ゲストユーザー用の特別な処理
      const { data: tableCheck, error: tableError } = await supabase.from("users").select("count").limit(1)

      if (tableError) {
        console.warn("usersテーブルが存在しません")
        return
      }

      const userData = {
        id: guestUser.id,
        email: guestUser.email!,
        name: guestUser.user_metadata?.name || "ゲストユーザー",
        updated_at: new Date().toISOString(),
      }

      console.log("ゲストユーザー同期データ:", userData)

      // ゲストユーザーを直接INSERT（RLS制約を回避するため）
      const { error } = await supabase.from("users").upsert([userData], {
        onConflict: "id",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error("ゲストユーザー同期エラー:", error)
        // エラーでも続行（ゲスト機能を止めない）
      } else {
        console.log("✅ ゲストユーザー同期完了:", guestUser.id)
      }
    } catch (err: any) {
      console.error("❌ syncGuestToDatabase 失敗:", err)
      // エラーでも続行
    }
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("セッション取得エラー:", sessionError)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log("セッション取得成功:", session.user.id)
          setUser(session.user)
          await syncUserToDatabase(session.user)
        } else {
          console.log("セッションなし")
        }
      } catch (error) {
        console.error("セッション処理エラー:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("認証状態変更:", event, session?.user?.id)

      if (session?.user) {
        setUser(session.user)
        await syncUserToDatabase(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      await syncUserToDatabase(data.user)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      await syncUserToDatabase(data.user)
    }
  }

  const signInAsGuest = async (name: string) => {
    const guestId = crypto.randomUUID()
    const guestUser = {
      id: guestId,
      email: `${guestId}@guest.local`,
      user_metadata: {
        name,
        is_guest: true,
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User

    setUser(guestUser)
    setIsGuest(true)

    // ゲストユーザーもDBに追加
    await syncGuestToDatabase(guestUser)
  }

  const signOut = async () => {
    if (isGuest) {
      setUser(null)
      setIsGuest(false)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
