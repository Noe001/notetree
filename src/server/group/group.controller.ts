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

import { GroupMemberRole } from './types';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupAccessGuard } from './group-access.guard';
import { GroupOwnerGuard } from './group-owner.guard';

@Controller('groups')
export class GroupController {
  private readonly logger = new Logger(GroupController.name);

  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req: any) {
    try {
      this.logger.log('POST /groups called');
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const group = await this.groupService.create(createGroupDto, ownerId);
      return {
        success: true,
        data: group,
        message: 'Group created successfully'
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: any) {
    try {
      this.logger.log('GET /groups called');
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const groups = await this.groupService.findUserGroups(userId);
      return {
        success: true,
        data: groups,
        count: groups.length
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`GET /groups/${id} called`);
      const group = await this.groupService.findOne(id);
      return {
        success: true,
        data: group
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
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
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`DELETE /groups/${id} called`);
      await this.groupService.remove(id);
      return {
        success: true,
        message: 'Group deleted successfully'
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
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
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
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
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
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
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async inviteMember(@Param('id') groupId: string, @Body() inviteMemberDto: InviteMemberDto, @Req() req: any) {
    try {
      this.logger.log(`POST /groups/${groupId}/invite called`);
      const invitedById = req.user?.id;
      if (!invitedById) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.groupService.inviteMember(groupId, inviteMemberDto, invitedById);
      return {
        success: true,
        data: result,
        message: 'Invitation sent successfully'
      };
    } catch (error: any) {
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

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Param('id') groupId: string, @Req() req: any, @Body() body?: { invitationToken?: string }) {
    try {
      this.logger.log(`POST /groups/${groupId}/join called`);
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      
      const invitationToken = body?.invitationToken;
      const member = await this.groupService.joinGroupWithInvitation(groupId, userId, invitationToken);
      
      return {
        success: true,
        data: member,
        message: invitationToken ? 'Successfully joined group with invitation' : 'Successfully joined group'
      };
    } catch (error: any) {
      this.logger.error(`Error joining group: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to join group',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  async getInvitations(@Param('id') groupId: string) {
    try {
      this.logger.log(`GET /groups/${groupId}/invitations called`);
      const invitations = await this.groupService.getGroupInvitations(groupId);
      return {
        success: true,
        data: invitations,
        count: invitations.length
      };
    } catch (error: any) {
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

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async leaveGroup(@Param('id') groupId: string, @Req() req: any) {
    try {
      this.logger.log(`POST /groups/${groupId}/leave called`);
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      
      await this.groupService.removeMember(groupId, userId);
      return {
        success: true,
        message: 'Successfully left the group'
      };
    } catch (error: any) {
      this.logger.error(`Error leaving group: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to leave group',
          error: error.name
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
