import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoService } from '@app/memo/memo.service';
import { Memo } from '@app/memo/memo.entity';
import { User } from '@app/user/user.entity';
import { Group } from '@app/group/group.entity';
import { UserService } from '@app/user/user.service';
import { CreateMemoDto } from '@app/memo/dto/create-memo.dto';
import { UpdateMemoDto } from '@app/memo/dto/update-memo.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockMemos: Memo[] = [
  {
    id: '1',
    title: 'Test Memo 1',
    content: 'Test Content 1',
    tags: ['test', 'memo'],
    isPrivate: false,
    groupId: null,
    user: { id: 'user1' } as any,
    group: null as any,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  } as Memo,
  {
    id: '2',
    title: 'Test Memo 2',
    content: 'Test Content 2',
    tags: ['private', 'memo'],
    isPrivate: true,
    groupId: null,
    user: { id: 'user1' } as any,
    group: null as any,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  } as Memo
];

describe('MemoService', () => {
  let service: MemoService;
  let repository: Repository<Memo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoService,
        {
          provide: getRepositoryToken(Memo),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
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
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MemoService>(MemoService);
    repository = module.get<Repository<Memo>>(getRepositoryToken(Memo));
  });

  describe('create()', () => {
    it('should create a new memo', async () => {
      const createDto: CreateMemoDto = {
        title: 'New Memo',
        content: 'New Content',
        tags: ['new', 'memo'],
        isPrivate: false
      };
      const userId = 'user1';
      const expectedMemo = {
        ...mockMemos[0],
        ...createDto,
        user: { id: userId } as any,
        id: undefined
      };

      jest.spyOn(repository, 'create').mockReturnValue(expectedMemo as any);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...expectedMemo, id: '3' } as any);

      const result = await service.create(createDto, userId);
      expect(result).toEqual({ ...expectedMemo, id: '3' });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        user: { id: userId } as any
      });
      expect(repository.save).toHaveBeenCalledWith(expectedMemo);
    });

    it('should throw error when title is empty', async () => {
      const createDto: CreateMemoDto = {
        title: '',
        content: 'Content',
        tags: [],
        isPrivate: false
      };
      const userId = 'user1';

      await expect(service.create(createDto, userId)).rejects.toThrow(
        new HttpException('Title is required', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when content is empty', async () => {
      const createDto: CreateMemoDto = {
        title: 'Title',
        content: '',
        tags: [],
        isPrivate: false
      };
      const userId = 'user1';

      await expect(service.create(createDto, userId)).rejects.toThrow(
        new HttpException('Content is required', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('findAll()', () => {
    it('should return all public memos for a user', async () => {
      const userId = 'user1';
      const expectedMemos = mockMemos.filter(memo => 
        !memo.isPrivate || memo.user.id === userId
      );

      jest.spyOn(repository, 'find').mockResolvedValue(expectedMemos);

      const result = await service.findAll(userId);
      expect(result).toEqual(expectedMemos);
      expect(repository.find).toHaveBeenCalledWith({
        where: [
          { isPrivate: false },
          { user: { id: userId } }
        ],
        order: { updatedAt: 'DESC' }
      });
    });

    it('should return empty array when no memos found', async () => {
      const userId = 'user1';
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAll(userId);
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('should return a memo by id for authorized user', async () => {
      const memoId = '1';
      const userId = 'user1';
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockMemos[0]);

      const result = await service.findOne(memoId, userId);
      expect(result).toEqual(mockMemos[0]);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: memoId },
        relations: ['user']
      });
    });

    it('should throw error when memo not found', async () => {
      const memoId = '999';
      const userId = 'user1';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(memoId, userId)).rejects.toThrow(
        new HttpException(`Memo with ID ${memoId} not found`, HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error when trying to access private memo of another user', async () => {
      const memoId = '2';
      const userId = 'user2';
      const privateMemo = { ...mockMemos[1], user: { id: 'user1' } as any };
      jest.spyOn(repository, 'findOne').mockResolvedValue(privateMemo as any);

      await expect(service.findOne(memoId, userId)).rejects.toThrow(
        new HttpException('Access denied', HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('update()', () => {
    it('should update a memo', async () => {
      const memoId = '1';
      const userId = 'user1';
      const updateDto: UpdateMemoDto = {
        title: 'Updated Title',
        content: 'Updated Content'
      };
      const existingMemo = mockMemos[0];
      const updatedMemo = { ...existingMemo, ...updateDto };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMemo);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(repository, 'findOne').mockResolvedValue(updatedMemo);

      const result = await service.update(memoId, updateDto, userId);
      expect(result).toEqual(updatedMemo);
      expect(repository.update).toHaveBeenCalledWith(memoId, updateDto);
    });

    it('should throw error when trying to update memo of another user', async () => {
      const memoId = '1';
      const userId = 'user2';
      const updateDto: UpdateMemoDto = { title: 'Updated' };
      const existingMemo = { ...mockMemos[0], user: { id: 'user1' } as any };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMemo as any);

      await expect(service.update(memoId, updateDto, userId)).rejects.toThrow(
        new HttpException('Access denied', HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when memo not found', async () => {
      const memoId = '999';
      const userId = 'user1';
      const updateDto: UpdateMemoDto = { title: 'Updated' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(memoId, updateDto, userId)).rejects.toThrow(
        new HttpException(`Memo with ID ${memoId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('remove()', () => {
    it('should delete a memo', async () => {
      const memoId = '1';
      const userId = 'user1';
      const existingMemo = mockMemos[0];

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMemo);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined as any);

      await service.remove(memoId, userId);
      expect(repository.delete).toHaveBeenCalledWith(memoId);
    });

    it('should throw error when trying to delete memo of another user', async () => {
      const memoId = '1';
      const userId = 'user2';
      const existingMemo = { ...mockMemos[0], user: { id: 'user1' } as any };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMemo as any);

      await expect(service.remove(memoId, userId)).rejects.toThrow(
        new HttpException('Access denied', HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when memo not found', async () => {
      const memoId = '999';
      const userId = 'user1';

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(memoId, userId)).rejects.toThrow(
        new HttpException(`Memo with ID ${memoId} not found`, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('search()', () => {
    it('should search memos by keyword', async () => {
      const keyword = 'test';
      const userId = 'user1';
      const expectedMemos = mockMemos.filter(memo => 
        memo.title.includes(keyword) || memo.content.includes(keyword)
      );

      jest.spyOn(repository, 'find').mockResolvedValue(expectedMemos);

      const result = await service.search(keyword, userId);
      expect(result).toEqual(expectedMemos);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return empty array when no matching memos found', async () => {
      const keyword = 'nonexistent';
      const userId = 'user1';
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.search(keyword, userId);
      expect(result).toEqual([]);
    });
  });




});
