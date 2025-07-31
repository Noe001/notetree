import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from '../src/group/group.module';
import { MemoModule } from '../src/memo/memo.module';
import { UserModule } from '../src/user/user.module';
import { AuthModule } from '../src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'notetree_test',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true, // テスト用にスキーマを毎回削除
    }),
    AuthModule,
    GroupModule,
    MemoModule,
    UserModule,
  ],
})
export class TestDatabaseModule {} 