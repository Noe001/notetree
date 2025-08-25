'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-background border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl font-bold tracking-tight">エラーが発生しました</h1>
                <p className="text-muted-foreground">
                  申し訳ありませんが、アプリケーションで予期しないエラーが発生しました。
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => reset()} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                再読み込み
              </Button>
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  ホームに戻る
                </Link>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground pt-4">
              <p>問題が解決しない場合は、しばらく時間をおいてから再度お試しください。</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}