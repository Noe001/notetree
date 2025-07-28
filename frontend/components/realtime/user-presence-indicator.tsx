import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UserPresenceEvent } from '@/lib/realtime'
import { Eye, Edit, Clock } from 'lucide-react'

interface UserPresenceIndicatorProps {
  presences: Map<string, UserPresenceEvent>
  users: Map<string, { name: string; email: string; avatar?: string }>
  className?: string
}

export function UserPresenceIndicator({ 
  presences, 
  users, 
  className = '' 
}: UserPresenceIndicatorProps) {
  const activeUsers = Array.from(presences.entries())
    .filter(([, presence]) => presence.action !== 'left')
    .sort((a, b) => {
      // 編集中のユーザーを優先表示
      if (a[1].action === 'editing' && b[1].action !== 'editing') return -1
      if (b[1].action === 'editing' && a[1].action !== 'editing') return 1
      
      // 最近のアクティビティ順
      return new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime()
    })

  if (activeUsers.length === 0) {
    return null
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'editing': return <Edit className="h-3 w-3 text-green-500" />
      case 'viewing': return <Eye className="h-3 w-3 text-blue-500" />
      default: return <Clock className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'editing': return '編集中'
      case 'viewing': return '閲覧中'
      default: return 'アクティブ'
    }
  }

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'editing': return 'bg-green-500'
      case 'viewing': return 'bg-blue-500'
      default: return 'bg-muted-foreground'
    }
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          {activeUsers.slice(0, 5).map(([userId, presence]) => {
            const user = users.get(userId)
            if (!user) return null

            return (
              <Tooltip key={userId}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* ステータスインジケーター */}
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(presence.action)}`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex items-center space-x-2">
                  {getActionIcon(presence.action)}
                  <span className="text-sm">
                    {user.name} - {getActionText(presence.action)}
                  </span>
                  {presence.cursor && presence.action === 'editing' && (
                    <Badge variant="outline" className="text-xs">
                      カーソル: {presence.cursor.position}
                    </Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
          
          {activeUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-8 h-8 bg-muted border-2 border-background rounded-full">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{activeUsers.length - 5}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  {activeUsers.slice(5).map(([userId, presence]) => {
                    const user = users.get(userId)
                    if (!user) return null
                    
                    return (
                      <div key={userId} className="flex items-center space-x-2 text-sm">
                        {getActionIcon(presence.action)}
                        <span>{user.name}</span>
                      </div>
                    )
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* アクティブユーザー数の表示 */}
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{activeUsers.filter(([, p]) => p.action === 'editing').length}</span>
          </div>
          <span>編集中</span>
          
          {activeUsers.filter(([, p]) => p.action === 'viewing').length > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{activeUsers.filter(([, p]) => p.action === 'viewing').length}</span>
              </div>
              <span>閲覧中</span>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
} 
