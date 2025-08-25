"use client";

import { useState } from 'react'
import { validators } from '@/lib/security'
import { useAuth } from '@/lib/auth-context'

export interface LoginFormState {
  email: string
  password: string
}

export interface SignUpFormState {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthFormErrors {
  [key: string]: string
}

export function useAuthForms() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<AuthFormErrors>({})

  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: '',
    password: ''
  })

  const [signUpForm, setSignUpForm] = useState<SignUpFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const validateLogin = (): boolean => {
    const emailValidation = validators.email(loginForm.email)
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error! })
      return false
    }
    if (!loginForm.password) {
      setErrors({ password: 'パスワードを入力してください' })
      return false
    }
    return true
  }

  const validateSignUp = (): boolean => {
    const emailValidation = validators.email(signUpForm.email)
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error! })
      return false
    }

    const usernameValidation = validators.username(signUpForm.username)
    if (!usernameValidation.valid) {
      setErrors({ username: usernameValidation.error! })
      return false
    }

    if (signUpForm.password.length < 6) {
      setErrors({ password: 'パスワードは6文字以上で入力してください' })
      return false
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setErrors({ confirmPassword: 'パスワードが一致しません' })
      return false
    }

    return true
  }

  const handleEmailLogin = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    if (!validateLogin()) {
      setIsLoading(false)
      return false
    }

    try {
      const { error } = await signInWithEmail(loginForm.email, loginForm.password)
      if (error) {
        setErrors({ general: 'ログインに失敗しました。メールアドレスまたはパスワードを確認してください。' })
        return false
      } else {
        setLoginForm({ email: '', password: '' })
        return true
      }
    } catch (error: unknown) {
      setErrors({ general: 'ログインに失敗しました。' })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    if (!validateSignUp()) {
      setIsLoading(false)
      return false
    }

    try {
      const { error } = await signUpWithEmail(signUpForm.email, signUpForm.password, signUpForm.username)
      if (error) {
        setErrors({ general: 'アカウント作成に失敗しました: ' + error.message })
        return false
      } else {
        setSignUpForm({ username: '', email: '', password: '', confirmPassword: '' })
        return true
      }
    } catch (error: unknown) {
      setErrors({ general: 'アカウント作成に失敗しました。' })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    errors,
    setErrors,
    loginForm,
    setLoginForm,
    signUpForm,
    setSignUpForm,
    handleEmailLogin,
    handleEmailSignUp,
  }
}


