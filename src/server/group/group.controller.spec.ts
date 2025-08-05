import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { mockGroups } from '../../../lib/mock-data';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('GroupController', () => {
  let controller: GroupController;
  let service: GroupService;

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
          },
        },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    service = module.get<GroupService>(GroupService);
  });

  describe('create()', () => {
    it('should create a new group', async () => {
      const createDto: CreateGroupDto = {
        name: 'Test Group',
        description: 'Test Description'
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockGroups[0]);

      const result = await controller.create(createDto, { user: { id: 'test-user-id' } });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroups[0]);
      expect(service.create).toHaveBeenCalledWith(createDto, 'test-user-id');
    });

    it('should throw 400 error when name is empty', async () => {
      const createDto = { name: '', description: 'Invalid' };
      jest.spyOn(service, 'create').mockRejectedValue(
        new HttpException('Group name is required', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.create(createDto, { user: { id: 'test-user-id' } })).rejects.toThrow(HttpException);
    });
  });

  describe('findAll()', () => {
    it('should return an array of groups', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(mockGroups);

      const result = await controller.findAll({ user: { id: 'test-user-id' } });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroups);
      expect(result.count).toBe(mockGroups.length);
    });

    it('should handle empty array when no groups exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll({ user: { id: 'test-user-id' } });
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('findOne()', () => {
    it('should return a single group', async () => {
      const groupId = '1';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockGroups[0]);

      const result = await controller.findOne(groupId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGroups[0]);
    });

    it('should throw 404 when group not found', async () => {
      const groupId = '999';
      jest.spyOn(service, 'findOne').mockRejectedValue(
        new HttpException('Group not found', HttpStatus.NOT_FOUND)
      );

      await expect(controller.findOne(groupId)).rejects.toThrow(HttpException);
    });
  });

  describe('update()', () => {
    it('should update a group', async () => {
      const groupId = '1';
      const updateDto: UpdateGroupDto = { name: 'Updated Name' };
      const updatedGroup = { ...mockGroups[0], ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedGroup);

      const result = await controller.update(groupId, updateDto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedGroup);
    });

    it('should throw 404 when updating non-existent group', async () => {
      const groupId = '999';
      jest.spyOn(service, 'update').mockRejectedValue(
        new HttpException('Group not found', HttpStatus.NOT_FOUND)
      );

      await expect(controller.update(groupId, {})).rejects.toThrow(HttpException);
    });
  });

  describe('delete()', () => {
    it('should delete a group', async () => {
      const groupId = '1';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined as any);

      const result = await controller.remove(groupId);
      expect(result.success).toBe(true);
      expect(service.remove).toHaveBeenCalledWith(groupId);
    });

    it('should throw 404 when deleting non-existent group', async () => {
      const groupId = '999';
      jest.spyOn(service, 'remove').mockRejectedValue(
        new HttpException('Group not found', HttpStatus.NOT_FOUND)
      );

      await expect(controller.remove(groupId)).rejects.toThrow(HttpException);
    });
  });
});
