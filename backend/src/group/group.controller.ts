import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Logger,
  Req,
  UseGuards
} from '@nestjs/common';

import { GroupMemberRole } from './group-member.entity';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Controller('groups')
export class GroupController {
  private readonly logger = new Logger(GroupController.name);

  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req: any) {
    try {
      this.logger.log('POST /groups called');
      const ownerId = req.user?.id || 'test-user-id'; // 暫定的なユーザーID
      const group = await this.groupService.create(createGroupDto, ownerId);
      return {
        success: true,
        data: group,
        message: 'Group created successfully'
      };
    } catch (error) {
      this.logger.error(`Error creating group: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create group',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll() {
    try {
      this.logger.log('GET /groups called');
      const groups = await this.groupService.findAll();
      return {
        success: true,
        data: groups,
        count: groups.length
      };
    } catch (error) {
      this.logger.error(`Error fetching groups: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch groups',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`GET /groups/${id} called`);
      const group = await this.groupService.findOne(id);
      return {
        success: true,
        data: group
      };
    } catch (error) {
      this.logger.error(`Error fetching group ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch group',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    try {
      this.logger.log(`PATCH /groups/${id} called`);
      const group = await this.groupService.update(id, updateGroupDto);
      return {
        success: true,
        data: group,
        message: 'Group updated successfully'
      };
    } catch (error) {
      this.logger.error(`Error updating group ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update group',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`DELETE /groups/${id} called`);
      await this.groupService.remove(id);
      return {
        success: true,
        message: 'Group deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Error deleting group ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete group',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') groupId: string,
    @Req() req: any
  ) {
    try {
      this.logger.log(`GET /groups/${groupId}/members called`);
      const members = await this.groupService.getMembers(groupId);
      return {
        success: true,
        data: members,
        count: members.length
      };
    } catch (error) {
      this.logger.error(`Error fetching members for group ${groupId}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch members',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/members')
  async addMember(
    @Param('id') groupId: string,
    @Body('userId') userId: string,
    @Body('role') role: GroupMemberRole = GroupMemberRole.MEMBER
  ) {
    try {
      this.logger.log(`POST /groups/${groupId}/members called`);
      const member = await this.groupService.addMember(groupId, userId, role);
      return {
        success: true,
        data: member,
        message: 'Member added successfully'
      };
    } catch (error) {
      this.logger.error(`Error adding member to group ${groupId}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to add member',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string
  ) {
    try {
      this.logger.log(`DELETE /groups/${groupId}/members/${userId} called`);
      await this.groupService.removeMember(groupId, userId);
      return {
        success: true,
        message: 'Member removed successfully'
      };
    } catch (error) {
      this.logger.error(`Error removing member from group ${groupId}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to remove member',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/invite')
  @UsePipes(new ValidationPipe({ transform: true }))
  async inviteMember(@Param('id') groupId: string, @Body() inviteMemberDto: InviteMemberDto, @Req() req) {
    try {
      this.logger.log(`POST /groups/${groupId}/invite called`);
      const invitedById = req.user?.id || 'test-user-id'; // 暫定的なユーザーID
      const result = await this.groupService.inviteMember(groupId, inviteMemberDto, invitedById);
      return {
        success: true,
        data: result,
        message: 'Invitation sent successfully'
      };
    } catch (error) {
      this.logger.error(`Error inviting member: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send invitation',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/invitations')
  async getInvitations(@Param('id') groupId: string) {
    try {
      this.logger.log(`GET /groups/${groupId}/invitations called`);
      const invitations = await this.groupService.getGroupInvitations(groupId);
      return {
        success: true,
        data: invitations,
        count: invitations.length
      };
    } catch (error) {
      this.logger.error(`Error fetching invitations: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch invitations',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
