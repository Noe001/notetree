import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/server/app.controller';
import { AppService } from '../../src/server/app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Mocked Service Response'),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return HTML response containing service message', () => {
      const result = appController.getHello();
      expect(result).toContain('<title>Notetree Backend</title>');
      expect(result).toContain('<h1>🌲 Notetree Backend</h1>');
      expect(result).toContain('Backend Status: ✅ Running');
      expect(result).toContain('Mocked Service Response');
      expect(appService.getHello).toHaveBeenCalled();
    });
  });
});
