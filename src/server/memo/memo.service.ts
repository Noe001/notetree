import { Injectable, NotFoundException, Logger, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Memo } from './memo.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class MemoService {
  private readonly logger = new Logger(MemoService.name);

  constructor(
    @InjectRepository(Memo)
    private readonly memoRepository: Repository<Memo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly userService: UserService,
  ) {}

  async create(createMemoDto: CreateMemoDto, userId: string): Promise<Memo> {
    try {
      this.logger.log(`Creating new memo for user ${userId}`);
      
      // 入力バリデーション
      if (!createMemoDto.title?.trim()) {
        throw new BadRequestException('Title is required');
      }

      // ユーザー確認
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // グループ確認（グループIDが指定されている場合）
      let group: Group | undefined;
      if (createMemoDto.groupId) {
        const foundGroup = await this.groupRepository.findOne({ 
          where: { id: createMemoDto.groupId },
          relations: ['members', 'members.user']
        });
        if (!foundGroup) {
          throw new NotFoundException('Group not found');
        }
        
        // グループメンバーかチェック
        const isMember = foundGroup.members?.some(member => member.user && member.user.id === userId);
        if (!isMember) {
          throw new ForbiddenException('You are not a member of this group');
        }
        group = foundGroup;
      }

      const memo = this.memoRepository.create({
        title: createMemoDto.title,
        content: createMemoDto.content,
        tags: createMemoDto.tags,
        isPrivate: createMemoDto.isPrivate || false,
        groupId: createMemoDto.groupId || null,
        user: user,
        group: group,
      });

      const savedMemo = await this.memoRepository.save(memo) as Memo;
      this.logger.log(`Memo created successfully with ID: ${savedMemo.id}`);
      return savedMemo;
    } catch (error: any) {
      this.logger.error(`Failed to create memo: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create memo');
    }
  }

  async findAll(userId?: string, groupId?: string): Promise<Memo[]> {
    try {
      this.logger.log(`Fetching memos for user: ${userId}, group: ${groupId}`);
      
      const queryBuilder = this.memoRepository.createQueryBuilder('memo')
        .leftJoinAndSelect('memo.user', 'user')
        .leftJoinAndSelect('memo.group', 'group');

      if (userId) {
        queryBuilder.andWhere('memo.user.id = :userId', { userId });
      }

      if (groupId) {
        queryBuilder.andWhere('memo.group.id = :groupId', { groupId });
      } else if (userId) {
        // 個人メモのみを取得（グループメモを除外）
        queryBuilder.andWhere('(memo.groupId IS NULL OR memo.groupId = :nullGroupId)', { nullGroupId: null });
      }

      queryBuilder.orderBy('memo.updatedAt', 'DESC');

      const memos = await queryBuilder.getMany();
      this.logger.log(`Found ${memos.length} memos`);
      return memos;
    } catch (error: any) {
      this.logger.error(`Failed to fetch memos: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch memos');
    }
  }

  async search(query: string, userId?: string, groupId?: string): Promise<Memo[]> {
    try {
      this.logger.log(`Searching memos with query: ${query}`);
      
      if (!query?.trim()) {
        throw new BadRequestException('Search query is required');
      }

      const queryBuilder = this.memoRepository.createQueryBuilder('memo')
        .leftJoinAndSelect('memo.user', 'user')
        .leftJoinAndSelect('memo.group', 'group')
        .where('(memo.title ILIKE :query OR memo.content ILIKE :query)', { query: `%${query}%` });

      if (userId) {
        queryBuilder.andWhere('memo.user.id = :userId', { userId });
      }

      if (groupId) {
        queryBuilder.andWhere('memo.group.id = :groupId', { groupId });
      } else if (userId) {
        // 個人メモのみを検索（グループメモを除外）
        queryBuilder.andWhere('(memo.groupId IS NULL OR memo.groupId = :nullGroupId)', { nullGroupId: null });
      }

      queryBuilder.orderBy('memo.updatedAt', 'DESC');

      const memos = await queryBuilder.getMany();
      this.logger.log(`Found ${memos.length} memos matching query`);
      return memos;
    } catch (error: any) {
      this.logger.error(`Failed to search memos: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search memos');
    }
  }

  async findOne(id: string, userId?: string): Promise<Memo> {
    try {
      this.logger.log(`Fetching memo with ID: ${id}`);
      
      if (!id) {
        throw new BadRequestException('Memo ID is required');
      }

      const memo = await this.memoRepository.findOne({
        where: { id },
        relations: ['user', 'group', 'group.members', 'group.members.user']
      });

      if (!memo) {
        throw new NotFoundException(`Memo with ID ${id} not found`);
      }

      // アクセス権限チェック
      if (userId) {
        const isOwner = memo.user.id === userId;
        const isGroupMember = memo.group && memo.group.members.some(member => member.user.id === userId);
        const hasAccess = isOwner || isGroupMember;
        
        if (!hasAccess && memo.isPrivate) {
          throw new ForbiddenException('You do not have access to this memo');
        }
      }

      return memo;
    } catch (error: any) {
      this.logger.error(`Failed to fetch memo ${id}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch memo');
    }
  }

  async update(id: string, updateMemoDto: UpdateMemoDto, userId: string): Promise<Memo> {
    try {
      this.logger.log(`Updating memo ${id} by user ${userId}`);

      if (!id) {
        throw new BadRequestException('Memo ID is required');
      }

      const memo = await this.findOne(id, userId);
      
      // 編集権限チェック
      const canEdit = memo.user.id === userId ||
        (memo.group && memo.group.members.some(member => member.user.id === userId));
      
      if (!canEdit) {
        throw new ForbiddenException('You do not have permission to edit this memo');
      }

      await this.memoRepository.update(id, updateMemoDto);
      const updatedMemo = await this.findOne(id, userId);
      
      this.logger.log(`Memo ${id} updated successfully`);
      return updatedMemo;
    } catch (error: any) {
      this.logger.error(`Failed to update memo ${id}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update memo');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting memo ${id} by user ${userId}`);

      if (!id) {
        throw new BadRequestException('Memo ID is required');
      }

      const memo = await this.findOne(id, userId);
      
      // 削除権限チェック（作成者のみ）
      if (memo.user.id !== userId) {
        throw new ForbiddenException('You can only delete your own memos');
      }

      await this.memoRepository.delete(id);
      this.logger.log(`Memo ${id} deleted successfully`);
    } catch (error: any) {
      this.logger.error(`Failed to delete memo ${id}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete memo');
    }
  }
}
