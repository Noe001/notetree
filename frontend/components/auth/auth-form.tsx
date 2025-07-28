import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { validators } from '@/lib/security'
import { Loader2 } from 'lucide-react'

export function AuthForm() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
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

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrors({})
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setErrors({ general: 'Googleログインに失敗しました: ' + error.message })
      }
    } catch (error: any) {
      console.error('ログインエラー:', error)
      setErrors({ general: 'Googleログインに失敗しました' })
    } finally {
      setIsLoading(false)
    }
  }

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

    const usernameValidation = validators.textLength(signUpForm.username, 2, 50)
    if (!usernameValidation.valid) {
      setErrors({ username: usernameValidation.error! })
      setIsLoading(false)
      return
    }

    if (signUpForm.password.length < 6) {
      setErrors({ password: 'パスワードは6文字以上で入力してください' })
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
        setErrors({ success: 'アカウントが作成されました。確認メールをチェックしてください。' })
        setSignUpForm({ username: '', email: '', password: '', confirmPassword: '' })
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

            <Separator />

            <Button 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Googleでログイン
                </>
              )}
            </Button>
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

            <Separator />

            <Button 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  アカウント作成中...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Googleでサインアップ
                </>
              )}
            </Button>
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
