import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from '@app/group/group.controller';
import { GroupService } from '@app/group/group.service';
import { CreateGroupDto } from '@app/group/dto/create-group.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Group } from '@app/group/group.entity';
import { GroupMember } from '@app/group/group-member.entity';
import { GroupMemberRole } from '@app/group/types';

const mockGroup: Group = {
  id: '1',
  name: 'Test Group',
  description: 'Test Description',
  isPrivate: false,
  ownerId: 'test-owner-id',
  members: [],
  memos: [],
  invitations: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as Group;

const mockMember: GroupMember = {
  id: '1',
  group: { id: '1' } as Group,
  user: { id: 'user1' } as any,
  role: GroupMemberRole.MEMBER,
  createdAt: new Date(),
  updatedAt: new Date()
} as GroupMember;

describe('GroupController', () => {
  let controller: GroupController;
  let groupService: GroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: GroupService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            addMember: jest.fn(),
            removeMember: jest.fn(),
            getMembers: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    groupService = module.get<GroupService>(GroupService);
  });

  describe('create()', () => {
    it('should create a new group', async () => {
      const createDto: CreateGroupDto = {
        name: 'Test Group',
        description: 'Test Description'
      };

      jest.spyOn(groupService, 'create').mockResolvedValue(mockGroup);

      const result = await controller.create(createDto, { user: { id: 'test-owner-id' } } as any);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroup);
      expect(groupService.create).toHaveBeenCalledWith(createDto, 'test-owner-id');
    });

    it('should throw BadRequestException when name is empty', async () => {
      const createDto: CreateGroupDto = {
        name: '',
        description: 'Test Description'
      };

      await expect(controller.create(createDto, { user: { id: 'test-owner-id' } } as any))
        .rejects
        .toThrow(HttpException);
    });

    it('should throw BadRequestException when name is too long', async () => {
      const createDto: CreateGroupDto = {
        name: 'a'.repeat(101),
        description: 'Test Description'
      };

      await expect(controller.create(createDto, { user: { id: 'test-owner-id' } } as any))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('findAll()', () => {
    it('should return all groups', async () => {
      const mockGroups = [mockGroup];

      jest.spyOn(groupService, 'findAll').mockResolvedValue(mockGroups);

      const result = await controller.findAll({ user: { id: 'test-user' } } as any);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroups);
      expect(groupService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a group by id', async () => {
      const groupId = '1';

      jest.spyOn(groupService, 'findOne').mockResolvedValue(mockGroup);

      const result = await controller.findOne(groupId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroup);
      expect(groupService.findOne).toHaveBeenCalledWith(groupId);
    });

    it('should throw NotFoundException when group not found', async () => {
      const groupId = 'non-existent-id';

      jest.spyOn(groupService, 'findOne').mockRejectedValue(
        new HttpException('Group not found', HttpStatus.NOT_FOUND)
      );

      await expect(controller.findOne(groupId))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('update()', () => {
    it('should update a group', async () => {
      const groupId = '1';
      const updateDto = { name: 'Updated Name' };
      const updatedGroup = { ...mockGroup, name: 'Updated Name' };

      jest.spyOn(groupService, 'update').mockResolvedValue(mockGroup);

      const result = await controller.update(groupId, updateDto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroup);
      expect(groupService.update).toHaveBeenCalledWith(groupId, updateDto);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const groupId = '1';
      const updateDto = { name: 'Updated Name' };

      jest.spyOn(groupService, 'update').mockRejectedValue(
        new HttpException('Forbidden', HttpStatus.FORBIDDEN)
      );

      await expect(controller.update(groupId, updateDto))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('remove()', () => {
    it('should delete a group', async () => {
      const groupId = '1';
      jest.spyOn(groupService, 'remove').mockResolvedValue();

      const result = await controller.remove(groupId);
      expect(result.success).toBe(true);
      expect(groupService.remove).toHaveBeenCalledWith(groupId);
    });
  });

  describe('addMember()', () => {
    it('should add a member to group', async () => {
      const groupId = '1';
      const userId = 'user1';
      const role = GroupMemberRole.MEMBER;

      jest.spyOn(groupService, 'addMember').mockResolvedValue(mockMember as any);

      const result = await controller.addMember(
        groupId,
        userId, role
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMember);
      expect(groupService.addMember).toHaveBeenCalledWith(groupId, userId, role);
    });
  });

  describe('removeMember()', () => {
    it('should remove a member from group', async () => {
      const groupId = '1';
      const userId = 'user1';
      jest.spyOn(groupService, 'removeMember').mockResolvedValue();

      const result = await controller.removeMember(groupId, userId);
      expect(result.success).toBe(true);
      expect(groupService.removeMember).toHaveBeenCalledWith(groupId, userId);
    });
  
    describe('getMembers()', () => {
      it('should return group members', async () => {
        const groupId = '1';
        const mockMembers = [mockMember];
  
        jest.spyOn(groupService, 'getMembers').mockResolvedValue(mockMembers);
  
        const result = await controller.getMembers(groupId, {} as any);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockMembers);
        expect(groupService.getMembers).toHaveBeenCalledWith(groupId);
      });
  
      it('should throw when group not found', async () => {
        const groupId = 'non-existent-id';
  
        jest.spyOn(groupService, 'getMembers').mockRejectedValue(
          new HttpException('Group not found', HttpStatus.NOT_FOUND)
        );
  
        await expect(controller.getMembers(groupId, {} as any))
          .rejects
          .toThrow(HttpException);
      });
    });
  });
});
