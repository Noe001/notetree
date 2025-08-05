import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroupModule } from './group/group.module';
import { MemoModule } from './memo/memo.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/postgres',
      autoLoadEntities: true,
      synchronize: false, // 一時的に無効化
      logging: true,
      extra: {
        uuidExtension: 'pgcrypto'
      }
    }),
    AuthModule,
    GroupModule,
    MemoModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
