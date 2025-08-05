import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from '../src/server/group/group.module';
import { MemoModule } from '../src/server/memo/memo.module';
import { UserModule } from '../src/server/user/user.module';
import { AuthModule } from '../src/server/auth/auth.module';

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