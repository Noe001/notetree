import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.log('POST /users called');
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create user',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll() {
    try {
      this.logger.log('GET /users called');
      const users = await this.userService.findAll();
      return {
        success: true,
        data: users,
        count: users.length
      };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch users',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async search(@Query('q') query: string) {
    try {
      this.logger.log(`GET /users/search called with query: ${query}`);
      if (!query) {
        throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
      }
      const users = await this.userService.search(query);
      return {
        success: true,
        data: users,
        count: users.length
      };
    } catch (error) {
      this.logger.error(`Error searching users: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to search users',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`GET /users/${id} called`);
      const user = await this.userService.findOne(id);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      this.logger.error(`Error fetching user ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch user',
          error: error.name
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(`PATCH /users/${id} called`);
      const user = await this.userService.update(id, updateUserDto);
      return {
        success: true,
        data: user,
        message: 'User updated successfully'
      };
    } catch (error) {
      this.logger.error(`Error updating user ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update user',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`DELETE /users/${id} called`);
      await this.userService.remove(id);
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Error deleting user ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete user',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 
