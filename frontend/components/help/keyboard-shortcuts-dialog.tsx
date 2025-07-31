import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Search, Plus, Edit, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    key: 'Ctrl+N',
    description: '新しいメモを作成',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+S',
    description: 'メモを保存',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+Shift+D',
    description: 'メモを削除',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+E',
    description: 'メモを編集',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+F',
    description: 'メモを検索',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+P',
    description: 'プライベート設定を切り替え',
    category: 'メモ操作'
  },
  {
    key: 'ArrowUp',
    description: '前のメモを選択',
    category: 'ナビゲーション'
  },
  {
    key: 'ArrowDown',
    description: '次のメモを選択',
    category: 'ナビゲーション'
  },
  {
    key: 'Ctrl+Shift+Up',
    description: 'メモを上に移動',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+Shift+Down',
    description: 'メモを下に移動',
    category: 'メモ操作'
  },
  {
    key: 'Ctrl+K',
    description: 'グループを切り替え',
    category: 'グループ操作'
  },
  {
    key: 'Ctrl+G',
    description: '新しいグループを作成',
    category: 'グループ操作'
  },
  {
    key: 'Ctrl+Shift+E',
    description: 'エクスポート/インポート',
    category: 'データ操作'
  },
  {
    key: 'Ctrl+/',
    description: 'ショートカットキー一覧を表示',
    category: 'ヘルプ'
  },
  {
    key: 'Ctrl+Shift+H',
    description: 'ヘルプを表示',
    category: 'ヘルプ'
  },
  {
    key: 'Esc',
    description: 'ダイアログを閉じる',
    category: '一般'
  }
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            ショートカットキー一覧
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Notetreeで使用できるショートカットキーの一覧です。作業効率を上げるために活用してください。
          </p>

          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {category === 'メモ操作' && <Edit className="w-4 h-4" />}
                {category === 'ナビゲーション' && <ArrowUp className="w-4 h-4" />}
                {category === 'グループ操作' && <Search className="w-4 h-4" />}
                {category === 'データ操作' && <Save className="w-4 h-4" />}
                {category === 'ヘルプ' && <Keyboard className="w-4 h-4" />}
                {category === '一般' && <Plus className="w-4 h-4" />}
                {category}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <span className="text-muted-foreground">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
              
              <Separator className="my-4" />
            </div>
          ))}

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">💡 ヒント:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Macをご利用の場合は、CtrlキーをCmdキーに置き換えてください</li>
              <li>ショートカットキーはダイアログが開いているときは無効になります</li>
              <li>一部のショートカットキーはブラウザの機能と競合する場合があります</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
