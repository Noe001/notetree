import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestDatabaseModule } from './test-database.module';
import { CreateGroupDto } from '../src/server/group/dto/create-group.dto';
import { UpdateGroupDto } from '../src/server/group/dto/update-group.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Group API', () => {
    let createdGroupId: string;

    it('should create a group (POST /groups)', async () => {
      const createDto: CreateGroupDto = {
        name: 'Test Group',
        description: 'Test Description'
      };

      const response = await request(app.getHttpServer())
        .post('/groups')
        .send(createDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      createdGroupId = response.body.data.id;
    });

    it('should get all groups (GET /groups)', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get a group by id (GET /groups/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/groups/${createdGroupId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdGroupId);
    });

    it('should update a group (PATCH /groups/:id)', async () => {
      const updateDto: UpdateGroupDto = {
        name: 'Updated Group Name'
      };

      const response = await request(app.getHttpServer())
        .patch(`/groups/${createdGroupId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateDto.name);
    });

    it('should delete a group (DELETE /groups/:id)', async () => {
      await request(app.getHttpServer())
        .delete(`/groups/${createdGroupId}`)
        .expect(200);
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', async () => {
      // WebSocket接続テストの実装
      // 実際の実装はWebSocketモジュールの構成に依存
    });
  });
});
