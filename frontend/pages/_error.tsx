import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/error/error-boundary';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

export default function ErrorPage({ 
  statusCode = 500, 
  title = 'エラーが発生しました',
  message = '申し訳ありませんが、アプリケーションで予期しないエラーが発生しました。'
}: ErrorPageProps) {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 400:
        return 'リクエストが不正です。';
      case 401:
        return '認証が必要です。';
      case 403:
        return 'アクセスが拒否されました。';
      case 404:
        return 'ページが見つかりません。';
      case 500:
        return 'サーバー内部エラーが発生しました。';
      default:
        return '予期しないエラーが発生しました。';
    }
  };

  const getErrorTitle = () => {
    switch (statusCode) {
      case 400:
        return '不正なリクエスト';
      case 401:
        return '認証が必要';
      case 403:
        return 'アクセス拒否';
      case 404:
        return 'ページが見つかりません';
      case 500:
        return 'サーバーエラー';
      default:
        return 'エラー';
    }
  };

  const displayMessage = message || getErrorMessage();
  const displayTitle = title || getErrorTitle();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-background border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  {statusCode}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
            <p className="text-muted-foreground">
              {displayMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
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
          <p className="mt-1">エラーコード: ERROR_{statusCode}</p>
        </div>
      </div>
    </div>
  );
}

// Next.jsのエラーページ用のgetInitialProps
ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
