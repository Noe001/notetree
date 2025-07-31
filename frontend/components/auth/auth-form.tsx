import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { validators } from '@/lib/security'
import { Loader2 } from 'lucide-react'

export function AuthForm() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('login')

  // ログインフォームの状態
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  // サインアップフォームの状態
  const [signUpForm, setSignUpForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // バリデーション
    const emailValidation = validators.email(loginForm.email)
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error! })
      setIsLoading(false)
      return
    }

    if (!loginForm.password) {
      setErrors({ password: 'パスワードを入力してください' })
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signInWithEmail(loginForm.email, loginForm.password)
      if (error) {
        setErrors({ general: 'ログインに失敗しました。メールアドレスまたはパスワードを確認してください。' })
      } else {
        setLoginForm({ email: '', password: '' })
      }
    } catch (error: any) {
      console.error('ログインエラー:', error)
      setErrors({ general: 'ログインに失敗しました。' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // バリデーション
    const emailValidation = validators.email(signUpForm.email)
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error! })
      setIsLoading(false)
      return
    }

    const usernameValidation = validators.username(signUpForm.username)
    if (!usernameValidation.valid) {
      setErrors({ username: usernameValidation.error! })
      setIsLoading(false)
      return
    }

    if (signUpForm.password.length < 8) {
      setErrors({ password: 'パスワードは8文字以上で入力してください' })
      setIsLoading(false)
      return
    }

    // パスワード強度チェック
    const passwordValidation = validators.password(signUpForm.password)
    if (!passwordValidation.valid) {
      setErrors({ password: passwordValidation.error! })
      setIsLoading(false)
      return
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setErrors({ confirmPassword: 'パスワードが一致しません' })
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signUpWithEmail(signUpForm.email, signUpForm.password, signUpForm.username)
      if (error) {
        setErrors({ general: 'アカウント作成に失敗しました: ' + error.message })
      } else {
        setErrors({ success: 'アカウントが作成されました。ログインしてください。' })
        setSignUpForm({ username: '', email: '', password: '', confirmPassword: '' })
        // サインアップ成功時はログインタブに切り替え
        setActiveTab('login')
      }
    } catch (error: any) {
      console.error('サインアップエラー:', error)
      setErrors({ general: 'アカウント作成に失敗しました。' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg w-full max-w-lg">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Notetreeへようこそ</h1>
          <p className="text-sm text-muted-foreground">
            アカウントにログインするか、新しくアカウントを作成してください。
          </p>
        </div>
        
        {/* シンプルなタブ切り替え */}
        <div className="grid w-full grid-cols-2 gap-1 p-1 bg-muted rounded-md">
          <button
            onClick={() => {
              console.log('ログインタブをクリック');
              setActiveTab('login');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
              activeTab === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => {
              console.log('サインアップタブをクリック');
              setActiveTab('signup');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
              activeTab === 'signup'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            サインアップ
          </button>
        </div>
        
        {/* ログインフォーム */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">メールアドレス</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="例: user@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">パスワード</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500' : ''}
                  placeholder="パスワードを入力"
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>
          </div>
        )}
        
        {/* サインアップフォーム */}
        {activeTab === 'signup' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">ユーザー名</Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={signUpForm.username}
                  onChange={(e) => setSignUpForm({ ...signUpForm, username: e.target.value })}
                  disabled={isLoading}
                  className={errors.username ? 'border-red-500' : ''}
                  placeholder="例: yamada_taro"
                />
                {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">メールアドレス</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="例: user@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">パスワード</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpForm.password}
                  onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500' : ''}
                  placeholder="6文字以上で入力"
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">パスワード確認</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  placeholder="パスワードを再入力"
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    アカウント作成中...
                  </>
                ) : (
                  'アカウントを作成'
                )}
              </Button>
            </form>
          </div>
        )}
        
        {errors.general && (
          <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-md border border-red-200">
            {errors.general}
          </div>
        )}
        
        {errors.success && (
          <div className="text-sm text-green-500 text-center bg-green-50 p-3 rounded-md border border-green-200">
            {errors.success}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          ログイン・サインアップすることで、利用規約とプライバシーポリシーに同意したことになります。
        </div>
      </div>
    </div>
  )
} 
