import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { GroupMemberRole } from './types';

@Entity()
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Group, (group) => group.members)
  group!: Group;

  @ManyToOne(() => User)
  user!: User;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role!: GroupMemberRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
