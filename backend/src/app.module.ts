import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { GroupModule } from './group/group.module';
import { MemoModule } from './memo/memo.module';
import { UserModule } from './user/user.module';
// import { Invitation } from './group/invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/postgres',
      autoLoadEntities: true,
      synchronize: true, // 開発環境のみ
    }),
    // GroupModule, // 一時的に無効化
    MemoModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
