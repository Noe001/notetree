import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../group.entity';
import { User } from '../../user/user.entity';

export class GroupResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: () => [MemberResponseDto] })
  members!: MemberResponseDto[];

  @ApiProperty({ type: () => [InvitationResponseDto] })
  invitations!: InvitationResponseDto[];

  constructor(group: Group) {
    this.id = group.id;
    this.name = group.name;
    this.description = group.description;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
    this.members = group.members?.map(m => new MemberResponseDto(m.user)) || [];
    this.invitations = group.invitations?.map(i => new InvitationResponseDto(i)) || [];
  }
}

export class MemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  email!: string;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
  }
}

export class InvitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  constructor(invitation: any) {
    this.id = invitation.id;
    this.email = invitation.email;
    this.status = invitation.status;
    this.createdAt = invitation.createdAt;
  }
}
