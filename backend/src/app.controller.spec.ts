import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns the API name and status', () => {
    expect(appController.getRoot()).toEqual({
      name: 'brainbox-api',
      status: 'ok',
    });
  });

  it('returns health info', () => {
    const health = appController.getHealth();
    expect(health.status).toBe('ok');
    expect(typeof health.uptime).toBe('number');
    expect(typeof health.timestamp).toBe('string');
  });
});
