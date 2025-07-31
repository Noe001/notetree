import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoController } from './memo.controller';
import { MemoService } from './memo.service';
import { Memo } from './memo.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Memo, User, Group]),
    UserModule,
  ],
  controllers: [MemoController],
  providers: [MemoService],
  exports: [MemoService],
})
export class MemoModule {} 
