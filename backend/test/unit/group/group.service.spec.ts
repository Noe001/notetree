import { Test, TestingModule } from '@nestjs/testing';
import { GroupMemberRole } from '@app/group/group-member.entity';
import { GroupService } from '@app/group/group.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from '@app/group/group.entity';
import { GroupMember } from '@app/group/group-member.entity';
import { Repository, DeleteResult } from 'typeorm';
import { CreateGroupDto } from '@app/group/dto/create-group.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InvitationService } from '@app/group/invitation.service';

const mockGroups: Group[] = [{
  id: '1',
  name: 'Test Group',
  description: 'Test Description',
  ownerId: 'test-owner-id',
  members: [],
  memos: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as Group];

describe('GroupService', () => {
  let service: GroupService;
  let invitationService: InvitationService;
  let groupRepository: Repository<Group>;
  let memberRepository: Repository<GroupMember>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(Group),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            createInvitation: jest.fn().mockResolvedValue({
              id: '1',
              token: 'test-token',
              email: 'test@example.com',
              role: GroupMemberRole.MEMBER
            }),
            findGroupInvitations: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    invitationService = module.get<InvitationService>(InvitationService);
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    memberRepository = module.get<Repository<GroupMember>>(getRepositoryToken(GroupMember));
  });

  describe('create()', () => {
    it('should create a new group', async () => {
      const createDto: CreateGroupDto = {
        name: 'Test Group',
        description: 'Test Description'
      };
      const expectedGroup = {
        ...mockGroups[0],
        ownerId: 'test-owner-id'
      };
      jest.spyOn(groupRepository, 'create').mockReturnValue(expectedGroup);
      jest.spyOn(groupRepository, 'save').mockResolvedValue(expectedGroup);

      const result = await service.create(createDto, 'test-owner-id');
      expect(result).toEqual(expectedGroup);
      expect(groupRepository.create).toHaveBeenCalledWith({
        ...createDto,
        ownerId: 'test-owner-id'
      });
    });

    it('should throw error when name is empty', async () => {
      const createDto = { name: '', description: 'Invalid' };
      await expect(service.create(createDto, 'test-owner-id')).rejects.toThrow(
        new HttpException('Group name is required', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('findAll()', () => {
    it('should return all groups', async () => {
      jest.spyOn(groupRepository, 'find').mockResolvedValue(mockGroups);
      const result = await service.findAll();
      expect(result).toEqual(mockGroups);
      expect(groupRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a group by id', async () => {
      const groupId = '1';
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      const result = await service.findOne(groupId);
      expect(result).toEqual(mockGroups[0]);
    });

    it('should throw error when group not found', async () => {
      const groupId = '999';
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(groupId)).rejects.toThrow(
        new HttpException(`Group with ID ${groupId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('update()', () => {
    it('should update a group', async () => {
      const groupId = '1';
      const updateDto = { name: 'Updated Name' };
      const existingGroup = mockGroups[0];
      const updatedGroup = { ...existingGroup, ...updateDto };

      jest.spyOn(groupRepository, 'findOne')
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      jest.spyOn(groupRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(groupId, updateDto);
      expect(result).toEqual(updatedGroup);
      expect(groupRepository.update).toHaveBeenCalledWith(groupId, updateDto);
    });
  });

  describe('remove()', () => {
    it('should delete a group', async () => {
      const groupId = '1';
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(groupRepository, 'delete').mockResolvedValue({ affected: 1 } as DeleteResult);

      await service.remove(groupId);
      expect(groupRepository.delete).toHaveBeenCalledWith(groupId);
    });
  });

  describe('addMember()', () => {
    it('should add a member to group', async () => {
      const groupId = '1';
      const userId = 'user1';
      const role = 'member';
      const mockMember: GroupMember = {
        id: '1',
        group: { id: groupId } as Group,
        user: { id: userId } as any,
        role: GroupMemberRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember;

      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'create').mockReturnValue(mockMember);
      jest.spyOn(memberRepository, 'save').mockResolvedValue(mockMember);

      const result = await service.addMember('1', 'user1', GroupMemberRole.MEMBER);
      expect(result).toEqual(mockMember);
    });

    it('should throw when group not found', async () => {
      const groupId = '999';
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);
      await expect(service.addMember('999', 'user1', GroupMemberRole.MEMBER))
        .rejects.toThrow(`Group with ID ${groupId} not found`);
    });

    it('should throw when member already exists', async () => {
      const groupId = '1';
      const userId = 'user1';
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue({
        id: '1',
        group: { id: groupId } as Group,
        user: { id: userId } as any,
        role: GroupMemberRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember);
      await expect(service.addMember('1', 'user1', GroupMemberRole.MEMBER))
        .rejects.toThrow(`User ${userId} is already a member of group ${groupId}`);
    });
    describe('getMembers()', () => {
      it('should return group members', async () => {
        const groupId = '1';
        const mockMembers = [
          {
            id: '1',
            group: { id: groupId } as Group,
            user: { id: 'user1', name: 'User One' } as any,
            role: GroupMemberRole.ADMIN,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
          },
          {
            id: '2',
            group: { id: groupId } as Group,
            user: { id: 'user2', name: 'User Two' } as any,
            role: GroupMemberRole.MEMBER,
            createdAt: new Date('2023-01-02'),
            updatedAt: new Date('2023-01-02')
          }
        ] as GroupMember[];
  
        jest.spyOn(memberRepository, 'find').mockResolvedValue(mockMembers);
        
        const result = await service.getMembers(groupId);
        expect(result).toEqual(mockMembers);
        expect(memberRepository.find).toHaveBeenCalledWith({
          where: { group: { id: groupId } },
          relations: ['user'],
          order: { role: 'DESC', createdAt: 'ASC' }
        });
      });
  
      it('should throw when groupId is empty', async () => {
        await expect(service.getMembers(''))
          .rejects.toThrow('Group ID is required');
      });
  
      it('should return empty array when no members found', async () => {
        const groupId = '1';
        jest.spyOn(memberRepository, 'find').mockResolvedValue([]);
        
        const result = await service.getMembers(groupId);
        expect(result).toEqual([]);
      });
    });
  
    describe('getGroupInvitations()', () => {
      it('should return group invitations', async () => {
        const groupId = '1';
        const mockInvitations = [{
          id: '1',
          token: 'test-token',
          email: 'test@example.com',
          invitedUserId: null,
          role: GroupMemberRole.MEMBER,
          expiresAt: new Date(Date.now() + 86400000),
          group: { id: groupId } as Group,
          invitedBy: { id: 'owner1' } as any,
          invitedById: 'owner1',
          groupId: groupId,
          invitedUser: null,
          isAccepted: false,
          acceptedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any];
        
        jest.spyOn(invitationService, 'findGroupInvitations').mockResolvedValue(mockInvitations);
        
        const result = await service.getGroupInvitations(groupId);
        expect(result).toEqual(mockInvitations);
        expect(invitationService.findGroupInvitations).toHaveBeenCalledWith(groupId);
      });
    });
  });

  describe('removeMember()', () => {
    it('should remove a member from group', async () => {
      const groupId = '1';
      const userId = 'user1';
      const mockMember: GroupMember = {
        id: '1',
        group: { id: groupId } as Group,
        user: { id: userId } as any,
        role: GroupMemberRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember;

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember);
      jest.spyOn(memberRepository, 'delete').mockResolvedValue({ affected: 1 } as DeleteResult);

      await service.removeMember('1', 'user1');
      expect(memberRepository.delete).toHaveBeenCalledWith({
        group: { id: groupId },
        user: { id: userId }
      });
    });

    it('should throw when member not found', async () => {
      const groupId = '1';
      const userId = 'user1';
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(null);
      await expect(service.removeMember('1', 'user1'))
        .rejects.toThrow(`Member ${userId} not found in group ${groupId}`);
    });

    it('should throw when trying to remove owner', async () => {
      const groupId = '1';
      const userId = 'user1';
      const mockMember: GroupMember = {
        id: '1',
        group: { id: groupId } as Group,
        user: { id: userId } as any,
        role: GroupMemberRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember;
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember);
      await expect(service.removeMember('1', 'user1'))
        .rejects.toThrow('Cannot remove admin from group');
    });
  });

  describe('inviteMember()', () => {
    it('should invite member by email', async () => {
      const groupId = '1';
      const inviteDto = { email: 'test@example.com', role: GroupMemberRole.MEMBER };
      const invitedById = 'owner1';
      
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue({
        id: '1',
        group: { id: groupId } as Group,
        user: { id: invitedById } as any,
        role: GroupMemberRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember);

      const result = await service.inviteMember(groupId, inviteDto, invitedById);
      expect(result).toHaveProperty('invitation');
      expect(result).toHaveProperty('inviteLink');
      expect(result.inviteLink).toContain('token=');
    });

    it('should invite member by userId', async () => {
      const groupId = '1';
      const inviteDto = { userId: 'user1', role: GroupMemberRole.MEMBER };
      const invitedById = 'owner1';
      
      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue({
        id: '1',
        group: { id: groupId } as Group,
        user: { id: invitedById } as any,
        role: GroupMemberRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember);

      const result = await service.inviteMember(groupId, inviteDto, invitedById);
      expect(result.invitation.email).toEqual('user-user1@example.com');
    });

    it('should throw when neither email nor userId provided', async () => {
      const groupId = '1';
      const inviteDto = { role: GroupMemberRole.MEMBER };
      const invitedById = 'owner1';
      
      await expect(service.inviteMember(groupId, inviteDto, invitedById))
        .rejects.toThrow('Either email or userId must be provided');
    });

    it('should throw when group not found', async () => {
      const groupId = '999';
      const inviteDto = { email: 'test@example.com', role: GroupMemberRole.MEMBER };
      const invitedById = 'owner1';

      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(null);
      
      await expect(service.inviteMember(groupId, inviteDto, invitedById))
        .rejects.toThrow(`Group with ID ${groupId} not found`);
    });

    it('should throw when inviter is not group member', async () => {
      const groupId = '1';
      const inviteDto = { email: 'test@example.com', role: GroupMemberRole.MEMBER };
      const invitedById = 'non-member';

      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(null);
      
      await expect(service.inviteMember(groupId, inviteDto, invitedById))
        .rejects.toThrow(`User ${invitedById} is not a member of group ${groupId}`);
    });

    it('should throw when invalid role specified', async () => {
      const groupId = '1';
      const inviteDto = { email: 'test@example.com', role: 'invalid-role' };
      const invitedById = 'owner1';

      jest.spyOn(groupRepository, 'findOne').mockResolvedValue(mockGroups[0]);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue({
        id: '1',
        group: { id: groupId } as Group,
        user: { id: invitedById } as any,
        role: GroupMemberRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date()
      } as GroupMember);
      
      await expect(service.inviteMember(groupId, inviteDto as any, invitedById))
        .rejects.toThrow('Invalid role specified');
    });
  });
});


