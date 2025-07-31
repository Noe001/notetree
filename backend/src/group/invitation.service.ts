import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './invitation.entity';
import { GroupMemberRole } from './types';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { GroupMember } from './group-member.entity';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly userService: UserService,
  ) {}

  async createInvitation(
    groupId: string, 
    email: string, 
    invitedById: string, 
    role: GroupMemberRole = GroupMemberRole.MEMBER
  ): Promise<Invitation> {
    try {
      this.logger.log(`Creating invitation for ${email} to group ${groupId}`);

      // グループ存在確認
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
        relations: ['members', 'members.user']
      });
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      // 招待者権限確認
      const isAdmin = group.members.some(member => 
        member.user && member.user.id === invitedById && 
        (member.role === GroupMemberRole.ADMIN || group.ownerId === invitedById)
      );
      if (!isAdmin) {
        throw new BadRequestException('You do not have permission to invite members');
      }

      // 既存メンバー確認
      const existingMember = group.members.find(member => 
        member.user && (member.user.email === email || member.user.id === invitedUser?.id)
      );
      if (existingMember) {
        throw new BadRequestException('User is already a member of this group');
      }

      // 既存招待確認
      const existingInvitation = await this.invitationRepository.findOne({
        where: { 
          groupId, 
          email, 
          isAccepted: false 
        }
      });
      if (existingInvitation) {
        throw new BadRequestException('Invitation already exists for this email');
      }

      // 招待対象ユーザーを検索
      const invitedUser = await this.userService.findByEmail(email);

      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7日後に期限切れ

      const invitation = this.invitationRepository.create({
        token,
        email,
        invitedUserId: invitedUser?.id || null,
        role,
        expiresAt,
        groupId,
        invitedById
      });

      const savedInvitation = await this.invitationRepository.save(invitation) as Invitation;
      this.logger.log(`Invitation created with token: ${token}`);
      return savedInvitation;
    } catch (error: any) {
      this.logger.error(`Failed to create invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async acceptInvitation(token: string): Promise<GroupMember> {
    try {
      this.logger.log(`Accepting invitation with token: ${token}`);

      const invitation = await this.invitationRepository.findOne({
        where: { token },
        relations: ['group', 'invitedUser']
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.isAccepted) {
        throw new BadRequestException('Invitation has already been accepted');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }

      // ユーザーを取得または作成
      let user = invitation.invitedUser;
      if (!user) {
        const foundUser = await this.userService.findByEmail(invitation.email);
        if (!foundUser) {
          throw new BadRequestException('User not found. Please sign up first.');
        }
        user = foundUser;
      }

      // グループメンバーとして追加
      const member = this.groupMemberRepository.create({
        group: invitation.group,
        user,
        role: invitation.role
      });

      const savedMember = await this.groupMemberRepository.save(member);

      // 招待を承認済みにマーク
      invitation.isAccepted = true;
      invitation.acceptedAt = new Date();
      await this.invitationRepository.save(invitation);

      this.logger.log(`Invitation accepted for user ${user.email}`);
      return savedMember;
    } catch (error: any) {
      this.logger.error(`Failed to accept invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findGroupInvitations(groupId: string): Promise<Invitation[]> {
    try {
      this.logger.log(`Fetching invitations for group ${groupId}`);

      const invitations = await this.invitationRepository.find({
        where: { groupId },
        relations: ['invitedUser', 'invitedBy'],
        order: { createdAt: 'DESC' }
      });

      return invitations;
    } catch (error: any) {
      this.logger.error(`Failed to fetch group invitations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Canceling invitation ${invitationId}`);

      const invitation = await this.invitationRepository.findOne({
        where: { id: invitationId },
        relations: ['group']
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // 権限確認
      const group = await this.groupRepository.findOne({
        where: { id: invitation.groupId },
        relations: ['members', 'members.user']
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      const isAdmin = group.members.some(member => 
        member.user && member.user.id === userId && 
        (member.role === GroupMemberRole.ADMIN || member.role === GroupMemberRole.OWNER || group.ownerId === userId)
      );

      if (invitation.invitedById !== userId && !isAdmin) {
        throw new BadRequestException('You do not have permission to cancel this invitation');
      }

      await this.invitationRepository.delete(invitationId);
      this.logger.log(`Invitation ${invitationId} canceled`);
    } catch (error: any) {
      this.logger.error(`Failed to cancel invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelInvitationByToken(token: string): Promise<void> {
    try {
      this.logger.log(`Canceling invitation by token: ${token}`);

      const invitation = await this.invitationRepository.findOne({
        where: { token }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      await this.invitationRepository.delete({ token });
      this.logger.log(`Invitation with token ${token} canceled`);
    } catch (error: any) {
      this.logger.error(`Failed to cancel invitation by token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByToken(token: string): Promise<Invitation | null> {
    try {
      this.logger.log(`Finding invitation by token: ${token}`);

      const invitation = await this.invitationRepository.findOne({
        where: { token },
        relations: ['group']
      });

      return invitation;
    } catch (error: any) {
      this.logger.error(`Failed to find invitation by token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeByToken(token: string): Promise<void> {
    try {
      this.logger.log(`Removing invitation by token: ${token}`);

      const invitation = await this.invitationRepository.findOne({
        where: { token }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      await this.invitationRepository.delete({ token });
      this.logger.log(`Invitation with token ${token} removed`);
    } catch (error: any) {
      this.logger.error(`Failed to remove invitation by token: ${error.message}`, error.stack);
      throw error;
    }
  }
}
