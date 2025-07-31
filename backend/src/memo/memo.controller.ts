import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MemoService } from './memo.service';
import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('memos')
export class MemoController {
  private readonly logger = new Logger(MemoController.name);

  constructor(private readonly memoService: MemoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createMemoDto: CreateMemoDto, @Request() req: any) {
    try {
      this.logger.log('POST /memos called');
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const memo = await this.memoService.create(createMemoDto, userId);
      return {
        success: true,
        data: memo,
        message: 'Memo created successfully'
      };
    } catch (error: any) {
      this.logger.error(`Error creating memo: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create memo',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('groupId') groupId?: string) {
    try {
      this.logger.log('GET /memos called');
      const memos = await this.memoService.findAll(userId, groupId);
      return {
        success: true,
        data: memos,
        count: memos.length
      };
    } catch (error: any) {
      this.logger.error(`Error fetching memos: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch memos',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('userId') userId?: string, @Query('groupId') groupId?: string) {
    try {
      this.logger.log(`GET /memos/search called with query: ${query}`);
      if (!query) {
        throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
      }
      const memos = await this.memoService.search(query, userId, groupId);
      return {
        success: true,
        data: memos,
        count: memos.length
      };
    } catch (error: any) {
      this.logger.error(`Error searching memos: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to search memos',
          error: error.name
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    try {
      this.logger.log(`GET /memos/${id} called`);
      const userId = req.user?.id;
      const memo = await this.memoService.findOne(id, userId);
      return {
        success: true,
        data: memo
      };
    } catch (error: any) {
      this.logger.error(`Error fetching memo ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch memo',
          error: error.name
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateMemoDto: UpdateMemoDto, @Request() req: any) {
    try {
      this.logger.log(`PATCH /memos/${id} called`);
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const memo = await this.memoService.update(id, updateMemoDto, userId);
      return {
        success: true,
        data: memo,
        message: 'Memo updated successfully'
      };
    } catch (error: any) {
      this.logger.error(`Error updating memo ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update memo',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    try {
      this.logger.log(`DELETE /memos/${id} called`);
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      await this.memoService.remove(id, userId);
      return {
        success: true,
        message: 'Memo deleted successfully'
      };
    } catch (error: any) {
      this.logger.error(`Error deleting memo ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete memo',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
