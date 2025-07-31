import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.log(`Creating user: ${createUserDto.email}`);

      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email }
      });
      if (existingUser) {
        throw new ConflictException(`User with email ${createUserDto.email} already exists`);
      }

      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);

      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error: any) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      this.logger.log('Fetching all users');
      const users = await this.userRepository.find({
        relations: ['groupMemberships', 'groupMemberships.group']
      });
      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error: any) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async search(query: string): Promise<User[]> {
    try {
      this.logger.log(`Searching users with query: ${query}`);
      
      const users = await this.userRepository.find({
        where: [
          { name: ILike(`%${query}%`) },
          { email: ILike(`%${query}%`) }
        ]
      });

      this.logger.log(`Found ${users.length} users matching query`);
      return users;
    } catch (error: any) {
      this.logger.error(`Failed to search users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      this.logger.log(`Fetching user with ID: ${id}`);
      
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['groupMemberships', 'groupMemberships.group', 'memos']
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error: any) {
      this.logger.error(`Failed to fetch user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.log(`Fetching user with email: ${email}`);
      
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['groupMemberships', 'groupMemberships.group']
      });

      return user;
    } catch (error: any) {
      this.logger.error(`Failed to fetch user by email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);

      const existingUser = await this.findOne(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // メールアドレス変更時の重複チェック
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.userRepository.findOne({
          where: { email: updateUserDto.email }
        });
        if (emailExists) {
          throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
        }
      }

      // パスワードの更新は別途専用のメソッドを用意することを推奨
      const { password, ...restOfUpdates } = updateUserDto;
      if (password) {
        this.logger.warn(`Password updates are not supported via the general update method for user ${id}`);
      }

      await this.userRepository.update(id, restOfUpdates);
      const updatedUser = await this.findOne(id);

      this.logger.log(`User ${id} updated successfully`);
      return updatedUser;
    } catch (error: any) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);

      const user = await this.findOne(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.userRepository.delete(id);
      this.logger.log(`User ${id} deleted successfully`);
    } catch (error: any) {
      this.logger.error(`Failed to delete user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
