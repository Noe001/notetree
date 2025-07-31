import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';

@Entity()
export class Memo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column('simple-array', { nullable: true })
  tags!: string[];

  @Column({ default: false })
  isPrivate!: boolean;

  @Column({ nullable: true })
  groupId!: string | null;

  @ManyToOne(() => User, (user) => user.memos)
  user!: User;

  @ManyToOne(() => Group, (group) => group.memos, { nullable: true })
  group!: Group;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
