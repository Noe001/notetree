import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GroupService } from './group.service';

@Injectable()
export class GroupOwnerGuard implements CanActivate {
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
      // グループの存在確認とオーナー確認
      const group = await this.groupService.findOne(groupId);
      
      // オーナーかどうか確認
      if (group.ownerId === userId) {
        return true;
      }

      throw new ForbiddenException('Access denied: Only group owner can perform this action');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Access denied: Group not found or access error');
    }
  }
} 