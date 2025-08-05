import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GroupService } from './group.service';

@Injectable()
export class GroupAccessGuard implements CanActivate {
  constructor(private readonly groupService: GroupService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const groupId = request.params.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!groupId) {
      throw new ForbiddenException('Group ID is required');
    }

    try {
      // グループの存在確認とメンバーシップ確認
      const group = await this.groupService.findOne(groupId);
      
      // オーナーかどうか確認
      if (group.ownerId === userId) {
        return true;
      }

      // メンバーかどうか確認
      const isMember = group.members?.some(member => member.user?.id === userId);
      if (isMember) {
        return true;
      }

      throw new ForbiddenException('Access denied: You are not a member of this group');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Access denied: Group not found or access error');
    }
  }
} 
