import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, FileJson, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppNotifications } from '@/components/notification/notification-provider';

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'json' | 'markdown') => void;
  onImport: (data: string) => Promise<boolean>;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
}: ExportImportDialogProps) {
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const notify = useAppNotifications();

  const handleImport = async () => {
    if (!importData.trim()) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const success = await onImport(importData);
      setImportResult({
        success,
        message: success ? 'データのインポートが完了しました' : 'インポートに失敗しました。データ形式を確認してください。'
      });
      
      if (success) {
        setImportData('');
        notify.success('インポート完了', 'データのインポートが完了しました');
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'インポート中にエラーが発生しました: ' + (error as Error).message
      });
      notify.error('インポートに失敗しました', (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>データのエクスポート/インポート</DialogTitle>
          <DialogDescription>
            メモデータをエクスポートまたはインポートできます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* エクスポートセクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Download className="w-5 h-5" />
              データのエクスポート
            </h3>
            <p className="text-sm text-muted-foreground">
              現在のメモデータをファイルにエクスポートできます。バックアップや他のアプリへの移行にご利用ください。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => onExport('json')}
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <FileJson className="w-4 h-4" />
                JSON形式でエクスポート
              </Button>
              <Button 
                onClick={() => onExport('markdown')}
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <FileText className="w-4 h-4" />
                Markdown形式でエクスポート
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">エクスポートされるデータ:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>すべてのメモのタイトルと内容</li>
                    <li>タグ情報</li>
                    <li>作成日時と更新日時</li>
                    <li>プライベート設定</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* インポートセクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Upload className="w-5 h-5" />
              データのインポート
            </h3>
            <p className="text-sm text-muted-foreground">
              以前にエクスポートしたデータをインポートできます。JSON形式またはMarkdown形式に対応しています。
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      ファイルから読み込む
                    </span>
                  </Button>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,.md,.markdown,text/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  {importData ? `${importData.length} 文字` : 'ファイル未選択'}
                </span>
              </div>
              
              <div className="relative">
                <Label htmlFor="import-data" className="text-sm font-medium">
                  または直接データを貼り付けてください
                </Label>
                <Textarea
                  id="import-data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="ここにJSONまたはMarkdown形式のデータを貼り付けてください..."
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>
              
              {importResult && (
                <div className={`p-3 rounded-md text-sm ${
                  importResult.success 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {importResult.message}
                </div>
              )}
              
              <Button 
                onClick={handleImport}
                disabled={!importData.trim() || isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    データをインポート
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">インポートに関する注意:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>既存のメモとIDが重複する場合は上書きされます</li>
                    <li>不正なデータ形式はスキップされます</li>
                    <li>インポート後はページを再読み込みすることを推奨します</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
