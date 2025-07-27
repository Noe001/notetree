import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { GroupMemberRole } from './group-member.entity';

@Entity()
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  invitedUserId: string | null;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ default: false })
  isAccepted: boolean;

  @ManyToOne(() => Group)
  group: Group;

  @Column()
  groupId: string;

  @ManyToOne(() => User, { nullable: true })
  invitedUser: User;

  @ManyToOne(() => User)
  invitedBy: User;

  @Column()
  invitedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
