import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, X, Filter, Calendar, Tag } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
  groupId?: string;
  groupName?: string;
}

interface SearchResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  results: SearchResult[];
  onSearch: (query: string) => void;
  onSelectResult: (result: SearchResult) => void;
}

export function SearchResultsDialog({
  open,
  onOpenChange,
  searchQuery,
  results,
  onSearch,
  onSelectResult,
}: SearchResultsDialogProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = () => {
    onSearch(localQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            検索結果
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1">
          {/* 検索バー */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="検索キーワードを入力..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>検索</Button>
          </div>

          {/* 結果数 */}
          <div className="text-sm text-muted-foreground">
            {results?.length || 0} 件の結果
          </div>

          <Separator />

          {/* 検索結果リスト */}
          <div className="flex-1 overflow-y-auto">
            {results && results.length > 0 ? (
              <div className="space-y-3">
                {results?.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onSelectResult(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {highlightText(result.title || '無題', localQuery)}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {highlightText(result.content, localQuery)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {result.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {result.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              プライベート
                            </Badge>
                          )}
                          {result.groupName && (
                            <Badge variant="default" className="text-xs">
                              {result.groupName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(result.updatedAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-4" />
                <p className="text-lg mb-2">検索結果がありません</p>
                <p className="text-sm">別のキーワードでお試しください</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
