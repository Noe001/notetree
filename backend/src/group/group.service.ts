import { Injectable, NotFoundException, Logger, BadRequestException, ConflictException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { GroupMember, GroupMemberRole } from './group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { InvitationService } from './invitation.service';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly invitationService: InvitationService,
  ) {}

  async create(createGroupDto: CreateGroupDto, ownerId: string): Promise<Group> {
    try {
      this.logger.log(`Creating new group: ${createGroupDto.name}`);
      
      if (!createGroupDto.name?.trim()) {
        throw new BadRequestException('Group name is required');
      }

      const group = this.groupRepository.create({
        ...createGroupDto,
        ownerId
      });
      const savedGroup = await this.groupRepository.save(group);

      // オーナーをグループメンバーとして追加
      const ownerMember = this.groupMemberRepository.create({
        group: savedGroup,
        user: { id: ownerId },
        role: GroupMemberRole.ADMIN
      } as any);
      await this.groupMemberRepository.save(ownerMember);
      
      this.logger.log(`Group created successfully with ID: ${savedGroup.id}`);
      
      return savedGroup;
    } catch (error) {
      this.logger.error(`Failed to create group: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Group[]> {
    try {
      this.logger.log('Fetching all groups');
      const groups = await this.groupRepository.find({
        relations: ['members'],
      });
      this.logger.log(`Found ${groups.length} groups`);
      return groups;
    } catch (error) {
      this.logger.error(`Failed to fetch groups: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Group> {
    try {
      if (!id) {
        throw new BadRequestException('Group ID is required');
      }

      this.logger.log(`Fetching group with ID: ${id}`);
      const group = await this.groupRepository.findOne({ 
        where: { id },
        relations: ['members', 'memos'],
      });
      
      if (!group) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      
      return group;
    } catch (error) {
      this.logger.error(`Failed to fetch group ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateGroupDto: Partial<Group>): Promise<Group> {
    try {
      if (!id) {
        throw new BadRequestException('Group ID is required');
      }

      this.logger.log(`Updating group with ID: ${id}`);
      
      const existingGroup = await this.findOne(id);
      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      await this.groupRepository.update(id, updateGroupDto);
      const updatedGroup = await this.findOne(id);
      
      this.logger.log(`Group ${id} updated successfully`);
      
      return updatedGroup;
    } catch (error) {
      this.logger.error(`Failed to update group ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!id) {
        throw new BadRequestException('Group ID is required');
      }

      this.logger.log(`Deleting group with ID: ${id}`);
      
      const group = await this.findOne(id);
      if (!group) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      await this.groupRepository.delete(id);
      this.logger.log(`Group ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete group ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addMember(groupId: string, userId: string, role: GroupMemberRole): Promise<GroupMember> {
    try {
      this.logger.log(`Adding member ${userId} to group ${groupId} with role ${role}`);
      
      // グループが存在するか確認
      const group = await this.groupRepository.findOne({ where: { id: groupId } });
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      // 既にメンバーか確認
      const existingMember = await this.groupMemberRepository.findOne({
        where: { group: { id: groupId }, user: { id: userId } }
      });
      if (existingMember) {
        throw new ConflictException(`User ${userId} is already a member of group ${groupId}`);
      }

      // メンバー追加
      const member = this.groupMemberRepository.create({
        group: { id: groupId } as Group,
        user: { id: userId } as any,
        role
      });

      const savedMember = await this.groupMemberRepository.save(member);
      this.logger.log(`Member ${userId} added to group ${groupId} successfully`);
      
      return savedMember;
    } catch (error) {
      this.logger.error(`Failed to add member ${userId} to group ${groupId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Removing member ${userId} from group ${groupId}`);

      // メンバー存在確認
      const member = await this.groupMemberRepository.findOne({
        where: { group: { id: groupId }, user: { id: userId } },
        relations: ['group']
      });

      if (!member) {
        throw new NotFoundException(`Member ${userId} not found in group ${groupId}`);
      }

      if (member.role === GroupMemberRole.ADMIN) {
        throw new BadRequestException('Cannot remove admin from group');
      }

      await this.groupMemberRepository.delete({
        group: { id: groupId },
        user: { id: userId }
      });
      this.logger.log(`Member ${userId} removed from group ${groupId} successfully`);
    } catch (error) {
      this.logger.error(`Failed to remove member ${userId} from group ${groupId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateMemberRole(groupId: string, userId: string, newRole: GroupMemberRole): Promise<GroupMember> {
    try {
      this.logger.log(`Updating role for member ${userId} in group ${groupId} to ${newRole}`);

      // メンバー存在確認
      const member = await this.groupMemberRepository.findOne({
        where: { group: { id: groupId }, user: { id: userId } },
        relations: ['group']
      });

      if (!member) {
        throw new NotFoundException(`Member ${userId} not found in group ${groupId}`);
      }

      // 役割検証
      if (!Object.values(GroupMemberRole).includes(newRole)) {
        throw new BadRequestException('Invalid role specified');
      }

      // オーナー役割変更防止
      if (member.role === GroupMemberRole.ADMIN && newRole !== GroupMemberRole.ADMIN) {
        throw new BadRequestException('Cannot change owner role');
      }

      // 役割更新
      member.role = newRole;
      const updatedMember = await this.groupMemberRepository.save(member);
      
      this.logger.log(`Member ${userId} role updated to ${newRole} in group ${groupId}`);
      
      return updatedMember;
    } catch (error) {
      this.logger.error(`Failed to update member role: ${error.message}`, error.stack);
      throw error;
    }
  }

  async inviteMember(groupId: string, inviteMemberDto: InviteMemberDto, invitedById: string): Promise<any> {
    try {
      this.logger.log(`Inviting member to group ${groupId}`);

      if (!inviteMemberDto.email && !inviteMemberDto.userId) {
        throw new BadRequestException('Either email or userId must be provided');
      }

      let email = inviteMemberDto.email;
      if (!email && inviteMemberDto.userId) {
        // UserServiceを使ってユーザーIDからメールアドレスを取得
        // 簡易実装のため、暫定的に処理
        email = `user-${inviteMemberDto.userId}@example.com`;
      }

      const invitation = await this.invitationService.createInvitation(
        groupId,
        email!,
        invitedById,
        inviteMemberDto.role || GroupMemberRole.MEMBER
      );

      return {
        invitation,
        inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitations/accept?token=${invitation.token}`
      };
    } catch (error) {
      this.logger.error(`Failed to invite member: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    try {
      this.logger.log(`Fetching members for group ${groupId}`);
      
      if (!groupId) {
        throw new BadRequestException('Group ID is required');
      }

      const members = await this.groupMemberRepository.find({
        where: { group: { id: groupId } },
        relations: ['user'],
        order: { role: 'DESC', createdAt: 'ASC' }
      });

      this.logger.log(`Found ${members.length} members for group ${groupId}`);
      return members;
    } catch (error) {
      this.logger.error(`Failed to fetch members for group ${groupId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getGroupInvitations(groupId: string): Promise<any[]> {
    try {
      return await this.invitationService.findGroupInvitations(groupId);
    } catch (error) {
      this.logger.error(`Failed to get group invitations: ${error.message}`, error.stack);
      throw error;
    }
  }
}
