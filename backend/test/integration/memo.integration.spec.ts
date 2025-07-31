import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestDatabaseModule } from '../test-database.module';
import { Memo } from '../../src/memo/memo.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('MemoController (integration)', () => {
  let app: INestApplication;
  let memoRepository: Repository<Memo>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    memoRepository = moduleFixture.get<Repository<Memo>>(getRepositoryToken(Memo));
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリーンアップ
    await memoRepository.query('DELETE FROM memos');
  });

  describe('GET /memos', () => {
    it('should return empty array when no memos exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/memos')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all memos', async () => {
      // テストデータを作成
      const memo1 = {
        title: 'Test Memo 1',
        content: 'Test Content 1',
        tags: ['test'],
        isPrivate: false
      };
      const memo2 = {
        title: 'Test Memo 2',
        content: 'Test Content 2',
        tags: ['test', 'memo'],
        isPrivate: true
      };

      await memoRepository.save([memo1, memo2]);

      const response = await request(app.getHttpServer())
        .get('/memos')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        title: 'Test Memo 1',
        content: 'Test Content 1',
        tags: ['test'],
        isPrivate: false
      });
      expect(response.body[1]).toMatchObject({
        title: 'Test Memo 2',
        content: 'Test Content 2',
        tags: ['test', 'memo'],
        isPrivate: true
      });
    });
  });

  describe('GET /memos/:id', () => {
    it('should return a memo by id', async () => {
      const memo = {
        title: 'Test Memo',
        content: 'Test Content',
        tags: ['test'],
        isPrivate: false
      };
      const savedMemo = await memoRepository.save(memo);

      const response = await request(app.getHttpServer())
        .get(`/memos/${savedMemo.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: savedMemo.id,
        title: 'Test Memo',
        content: 'Test Content',
        tags: ['test'],
        isPrivate: false
      });
    });

    it('should return 404 when memo not found', async () => {
      await request(app.getHttpServer())
        .get('/memos/999999')
        .expect(404);
    });
  });

  describe('POST /memos', () => {
    it('should create a new memo', async () => {
      const createDto = {
        title: 'New Memo',
        content: 'New Content',
        tags: ['new', 'memo'],
        isPrivate: false
      };

      const response = await request(app.getHttpServer())
        .post('/memos')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'New Memo',
        content: 'New Content',
        tags: ['new', 'memo'],
        isPrivate: false
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 when title is missing', async () => {
      const createDto = {
        content: 'Content without title',
        tags: [],
        isPrivate: false
      };

      await request(app.getHttpServer())
        .post('/memos')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 when content is missing', async () => {
      const createDto = {
        title: 'Title without content',
        tags: [],
        isPrivate: false
      };

      await request(app.getHttpServer())
        .post('/memos')
        .send(createDto)
        .expect(400);
    });
  });

  describe('PUT /memos/:id', () => {
    it('should update a memo', async () => {
      const memo = {
        title: 'Original Memo',
        content: 'Original Content',
        tags: ['original'],
        isPrivate: false
      };
      const savedMemo = await memoRepository.save(memo);

      const updateDto = {
        title: 'Updated Memo',
        content: 'Updated Content',
        tags: ['updated', 'memo']
      };

      const response = await request(app.getHttpServer())
        .put(`/memos/${savedMemo.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: savedMemo.id,
        title: 'Updated Memo',
        content: 'Updated Content',
        tags: ['updated', 'memo']
      });
    });

    it('should return 404 when memo not found', async () => {
      const updateDto = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      await request(app.getHttpServer())
        .put('/memos/999999')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /memos/:id', () => {
    it('should delete a memo', async () => {
      const memo = {
        title: 'Memo to delete',
        content: 'Content to delete',
        tags: [],
        isPrivate: false
      };
      const savedMemo = await memoRepository.save(memo);

      await request(app.getHttpServer())
        .delete(`/memos/${savedMemo.id}`)
        .expect(200);

      // メモが削除されたことを確認
      await request(app.getHttpServer())
        .get(`/memos/${savedMemo.id}`)
        .expect(404);
    });

    it('should return 404 when memo not found', async () => {
      await request(app.getHttpServer())
        .delete('/memos/999999')
        .expect(404);
    });
  });

  describe('GET /memos/search', () => {
    it('should search memos by keyword', async () => {
      const memo1 = {
        title: 'JavaScript Memo',
        content: 'This is about JavaScript programming',
        tags: ['javascript', 'programming'],
        isPrivate: false
      };
      const memo2 = {
        title: 'Python Memo',
        content: 'This is about Python programming',
        tags: ['python', 'programming'],
        isPrivate: false
      };

      await memoRepository.save([memo1, memo2]);

      const response = await request(app.getHttpServer())
        .get('/memos/search?keyword=JavaScript')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        title: 'JavaScript Memo',
        content: 'This is about JavaScript programming'
      });
    });

    it('should return empty array when no matches found', async () => {
      const memo = {
        title: 'Test Memo',
        content: 'Test Content',
        tags: [],
        isPrivate: false
      };
      await memoRepository.save(memo);

      const response = await request(app.getHttpServer())
        .get('/memos/search?keyword=nonexistent')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /memos/tag/:tag', () => {
    it('should return memos with specific tag', async () => {
      const memo1 = {
        title: 'Memo 1',
        content: 'Content 1',
        tags: ['test', 'memo'],
        isPrivate: false
      };
      const memo2 = {
        title: 'Memo 2',
        content: 'Content 2',
        tags: ['test', 'example'],
        isPrivate: false
      };
      const memo3 = {
        title: 'Memo 3',
        content: 'Content 3',
        tags: ['other'],
        isPrivate: false
      };

      await memoRepository.save([memo1, memo2, memo3]);

      const response = await request(app.getHttpServer())
        .get('/memos/tag/test')
        .expect(200);

      expect(response.body).toHaveLength(2);
      const titles = response.body.map((memo: any) => memo.title);
      expect(titles).toContain('Memo 1');
      expect(titles).toContain('Memo 2');
    });
  });
});
