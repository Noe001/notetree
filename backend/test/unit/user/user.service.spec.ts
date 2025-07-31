import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '@app/user/user.service';
import { User } from '@app/user/user.entity';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockUsers: User[] = [
  {
    id: '1',
    email: 'test1@example.com',
    name: 'Test User 1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  } as User,
  {
    id: '2',
    email: 'test2@example.com',
    name: 'Test User 2',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  } as User
];

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('create()', () => {
    it('should create a new user', async () => {
      const createDto: CreateUserDto = {
          email: 'newuser@example.com',
          name: 'New User',
          username: ''
      };
      const expectedUser = {
        ...mockUsers[0],
        ...createDto,
        id: undefined
      };

      jest.spyOn(repository, 'create').mockReturnValue(expectedUser as any);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...expectedUser, id: '3' } as any);

      const result = await service.create(createDto);
      expect(result).toEqual({ ...expectedUser, id: '3' });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
    });

    it('should throw error when email is empty', async () => {
      const createDto: CreateUserDto = {
          email: '',
          name: 'New User',
          username: ''
      };

      await expect(service.create(createDto)).rejects.toThrow(
        new HttpException('Email is required', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when name is empty', async () => {
      const createDto: CreateUserDto = {
          email: 'newuser@example.com',
          name: '',
          username: ''
      };

      await expect(service.create(createDto)).rejects.toThrow(
        new HttpException('Name is required', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('findAll()', () => {
    it('should return all users', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return empty array when no users found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUsers[0]);

      const result = await service.findOne(userId);
      expect(result).toEqual(mockUsers[0]);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw error when user not found', async () => {
      const userId = '999';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('findOneByEmail()', () => {
    it('should return a user by email', async () => {
      const email = 'test1@example.com';
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUsers[0]);

      const result = await service.findOneByEmail(email);
      expect(result).toEqual(mockUsers[0]);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOneByEmail(email);
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const existingUser = mockUsers[0];
      const updatedUser = { ...existingUser, ...updateData };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(repository, 'findOne').mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);
      expect(result).toEqual(updatedUser);
      expect(repository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw error when user not found', async () => {
      const userId = '999';
      const updateData = { name: 'Updated Name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(userId, updateData)).rejects.toThrow(
        new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('remove()', () => {
    it('should delete a user', async () => {
      const userId = '1';
      const existingUser = mockUsers[0];

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined as any);

      await service.remove(userId);
      expect(repository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      const userId = '999';

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(
        new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('getUserStats()', () => {
    it('should return user statistics', async () => {
      const userId = '1';
      const mockStats = {
        totalMemos: 10,
        totalGroups: 3,
        joinedGroups: 5
      };

      // モックの実装を調整
      const result = await service.getUserStats(userId);
      expect(typeof result).toBe('object');
    });
  });

  describe('getRecentActivity()', () => {
    it('should return recent user activity', async () => {
      const userId = '1';
      const limit = 10;

      // モックの実装を調整
      const result = await service.getRecentActivity(userId, limit);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
