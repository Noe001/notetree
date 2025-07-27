import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from './group.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { User } from '../user/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: any;
  let groupMemberRepository: any;
  let userRepository: any;

  const mockUser = {
    id: 'user1',
    name: 'テストユーザー',
    email: 'test@example.com'
  };

  const mockGroup = {
    id: 1,
    name: '仕事',
    description: '仕事関連のメモ',
    ownerId: 'user1'
  };

  const mockGroupMember = {
    id: 1,
    groupId: 1,
    userId: 'user1',
    role: 'owner'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(Group),
          useValue: {
            create: jest.fn().mockReturnValue(mockGroup),
            save: jest.fn().mockResolvedValue(mockGroup),
            find: jest.fn().mockResolvedValue([mockGroup]),
            findOne: jest.fn().mockResolvedValue(mockGroup),
            update: jest.fn().mockResolvedValue(mockGroup),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: {
            create: jest.fn().mockReturnValue(mockGroupMember),
            save: jest.fn().mockResolvedValue(mockGroupMember),
            find: jest.fn().mockResolvedValue([mockGroupMember]),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupRepository = module.get(getRepositoryToken(Group));
    groupMemberRepository = module.get(getRepositoryToken(GroupMember));
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('create()', () => {
    it('should create a group and add owner as member', async () => {
      const createDto: CreateGroupDto = {
        name: '仕事',
        ownerId: 'user1'
      };

      const result = await service.create(createDto);
      expect(result).toEqual(mockGroup);
      expect(groupRepository.create).toHaveBeenCalledWith(createDto);
      expect(groupMemberRepository.create).toHaveBeenCalledWith({
        groupId: mockGroup.id,
        userId: mockUser.id,
        role: 'owner'
      });
    });

    it('should throw error when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const createDto: CreateGroupDto = {
        name: '仕事',
        ownerId: 'invalid-user'
      };

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('addMember()', () => {
    it('should add a member to group', async () => {
      const result = await service.addMember(1, 'user2', 'member');
      expect(result).toEqual(mockGroupMember);
      expect(groupMemberRepository.create).toHaveBeenCalledWith({
        groupId: 1,
        userId: 'user2',
        role: 'member'
      });
    });

    it('should throw error when group not found', async () => {
      groupRepository.findOne.mockResolvedValue(null);
      await expect(service.addMember(999, 'user2', 'member')).rejects.toThrow();
    });
  });

  describe('removeMember()', () => {
    it('should remove a member from group', async () => {
      await service.removeMember(1, 'user1');
      expect(groupMemberRepository.delete).toHaveBeenCalledWith({
        groupId: 1,
        userId: 'user1'
      });
    });

    it('should not allow removing owner', async () => {
      groupMemberRepository.find.mockResolvedValue([{
        ...mockGroupMember,
        role: 'owner'
      }]);
      await expect(service.removeMember(1, 'user1')).rejects.toThrow();
    });
  });

  describe('findAll()', () => {
    it('should return all groups', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockGroup]);
      expect(groupRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a group by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockGroup);
      expect(groupRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
