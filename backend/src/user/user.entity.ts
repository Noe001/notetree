import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GroupMember } from '../group/group-member.entity';
import { Memo } from '../memo/memo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  profileImageUrl!: string;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groupMemberships!: GroupMember[];

  @OneToMany(() => Memo, (memo) => memo.user)
  memos!: Memo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
