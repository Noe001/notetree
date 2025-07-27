import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MemoService } from './memo.service';
import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';

@Controller('memos')
export class MemoController {
  private readonly logger = new Logger(MemoController.name);

  constructor(private readonly memoService: MemoService) {}

  @Post()
  async create(@Body() createMemoDto: CreateMemoDto, @Request() req) {
    try {
      this.logger.log('POST /memos called');
      const userId = req.user?.id || 'dc9282c0-707f-4030-888d-cb1d414108f7'; // 暫定的なユーザーID
      const memo = await this.memoService.create(createMemoDto, userId);
      return {
        success: true,
        data: memo,
        message: 'Memo created successfully'
      };
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`GET /memos/${id} called`);
      const userId = req.user?.id;
      const memo = await this.memoService.findOne(id, userId);
      return {
        success: true,
        data: memo
      };
    } catch (error) {
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
  async update(@Param('id') id: string, @Body() updateMemoDto: UpdateMemoDto, @Request() req) {
    try {
      this.logger.log(`PATCH /memos/${id} called`);
      const userId = req.user?.id || 'dc9282c0-707f-4030-888d-cb1d414108f7'; // 暫定的なユーザーID
      const memo = await this.memoService.update(id, updateMemoDto, userId);
      return {
        success: true,
        data: memo,
        message: 'Memo updated successfully'
      };
    } catch (error) {
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
  async remove(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`DELETE /memos/${id} called`);
      const userId = req.user?.id || 'dc9282c0-707f-4030-888d-cb1d414108f7'; // 暫定的なユーザーID
      await this.memoService.remove(id, userId);
      return {
        success: true,
        message: 'Memo deleted successfully'
      };
    } catch (error) {
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
