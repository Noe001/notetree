import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">ページが見つかりません</h2>
        <p className="text-muted-foreground mb-8">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link href="/">
          <Button className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            ホームに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
