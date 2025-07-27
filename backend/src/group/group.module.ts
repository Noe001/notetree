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

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, Invitation, User]),
    UserModule
  ],
  controllers: [GroupController],
  providers: [
    GroupService, 
    InvitationService,
  ],
  exports: [GroupService, InvitationService]
})
export class GroupModule {}
