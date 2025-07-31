import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { Invitation } from './invitation.entity';
import { InvitationService } from './invitation.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Memo } from '../memo/memo.entity';
import { MemoModule } from '../memo/memo.module';
import { GroupAccessGuard } from './group-access.guard';
import { GroupOwnerGuard } from './group-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, Invitation, User, Memo]),
    UserModule,
    MemoModule
  ],
  controllers: [GroupController],
  providers: [
    GroupService, 
    InvitationService,
    GroupAccessGuard,
    GroupOwnerGuard,
  ],
  exports: [GroupService, InvitationService]
})
export class GroupModule {}
