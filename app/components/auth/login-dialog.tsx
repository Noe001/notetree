import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { useAuthForms } from '@/lib/use-auth-forms'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const {
    isLoading,
    errors,
    loginForm,
    setLoginForm,
    signUpForm,
    setSignUpForm,
    handleEmailLogin,
    handleEmailSignUp,
  } = useAuthForms()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notetreeへようこそ</DialogTitle>
          <DialogDescription>
            アカウントにログインするか、新しくアカウントを作成してください。
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="signup">サインアップ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={async (e) => { const ok = await handleEmailLogin(e); if (ok) onOpenChange(false) }} className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={async (e) => { const ok = await handleEmailSignUp(e); if (ok) onOpenChange(false) }} className="space-y-4">
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
          </TabsContent>
        </Tabs>
        
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
      </DialogContent>
    </Dialog>
  )
} 
