import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return HTML response containing service message', () => {
      const result = appController.getHello();
      expect(result).toContain('<title>Notetree Backend</title>');
      expect(result).toContain('<h1>🌲 Notetree Backend</h1>');
      expect(result).toContain('Backend Status: ✅ Running');
      expect(result).toContain('Hello World!');
    });
  });
});
