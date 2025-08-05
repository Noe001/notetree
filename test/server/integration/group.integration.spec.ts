import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestDatabaseModule } from '../test-database.module';
import { Group } from '../../src/server/group/group.entity';
import { GroupMember } from '../../src/server/group/group-member.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('GroupController (integration)', () => {
  let app: INestApplication;
  let groupRepository: Repository<Group>;
  let memberRepository: Repository<GroupMember>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    groupRepository = moduleFixture.get<Repository<Group>>(getRepositoryToken(Group));
    memberRepository = moduleFixture.get<Repository<GroupMember>>(getRepositoryToken(GroupMember));
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリーンアップ
    await memberRepository.query('DELETE FROM group_members');
    await groupRepository.query('DELETE FROM groups');
  });

  describe('POST /groups', () => {
    it('should create a new group', async () => {
      const createDto = {
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false
      };

      const response = await request(app.getHttpServer())
        .post('/groups')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.ownerId).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      const createDto = {
        description: 'Description without name'
      };

      await request(app.getHttpServer())
        .post('/groups')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 when name is empty', async () => {
      const createDto = {
        name: '',
        description: 'Description with empty name'
      };

      await request(app.getHttpServer())
        .post('/groups')
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /groups', () => {
    it('should return empty array when no groups exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all groups', async () => {
      // テストデータを作成
      const group1 = groupRepository.create({
        name: 'Test Group 1',
        description: 'Test Description 1',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const group2 = groupRepository.create({
        name: 'Test Group 2',
        description: 'Test Description 2',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);

      await groupRepository.save(group1);
      await groupRepository.save(group2);

      const response = await request(app.getHttpServer())
        .get('/groups')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: 'Test Group 1',
        description: 'Test Description 1'
      });
      expect(response.body[1]).toMatchObject({
        name: 'Test Group 2',
        description: 'Test Description 2'
      });
    });
  });

  describe('GET /groups/:id', () => {
    it('should return a group by id', async () => {
      const group = groupRepository.create({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupEntity.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: groupEntity.id,
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false
      });
    });

    it('should return 404 when group not found', async () => {
      await request(app.getHttpServer())
        .get('/groups/999999')
        .expect(404);
    });
  });

  describe('PUT /groups/:id', () => {
    it('should update a group', async () => {
      const group = groupRepository.create({
        name: 'Original Group',
        description: 'Original Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const updateDto = {
        name: 'Updated Group',
        description: 'Updated Description',
        isPrivate: true
      };

      const response = await request(app.getHttpServer())
        .put(`/groups/${groupEntity.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: groupEntity.id,
        name: 'Updated Group',
        description: 'Updated Description',
        isPrivate: true
      });
    });

    it('should return 404 when group not found', async () => {
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      await request(app.getHttpServer())
        .put('/groups/999999')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /groups/:id', () => {
    it('should delete a group', async () => {
      const group = groupRepository.create({
        name: 'Group to delete',
        description: 'Description to delete',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      await request(app.getHttpServer())
        .delete(`/groups/${groupEntity.id}`)
        .expect(200);

      // グループが削除されたことを確認
      await request(app.getHttpServer())
        .get(`/groups/${groupEntity.id}`)
        .expect(404);
    });

    it('should return 404 when group not found', async () => {
      await request(app.getHttpServer())
        .delete('/groups/999999')
        .expect(404);
    });
  });

  describe('POST /groups/:id/members', () => {
    it('should add a member to group', async () => {
      const group = groupRepository.create({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const addMemberDto = {
        userId: 'user2',
        role: 'member'
      };

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupEntity.id}/members`)
        .send(addMemberDto)
        .expect(201);

      expect(response.body).toMatchObject({
        groupId: groupEntity.id,
        userId: 'user2',
        role: 'member'
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 404 when group not found', async () => {
      const addMemberDto = {
        userId: 'user2',
        role: 'member'
      };

      await request(app.getHttpServer())
        .post('/groups/999999/members')
        .send(addMemberDto)
        .expect(404);
    });
  });

  describe('GET /groups/:id/members', () => {
    it('should return group members', async () => {
      const group = groupRepository.create({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const member = memberRepository.create({
        groupId: groupEntity.id,
        userId: 'user2',
        role: 'member'
      } as any);
      await memberRepository.save(member);

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupEntity.id}/members`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        groupId: groupEntity.id,
        userId: 'user2',
        role: 'member'
      });
    });

    it('should return empty array when no members', async () => {
      const group = groupRepository.create({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupEntity.id}/members`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('DELETE /groups/:id/members/:userId', () => {
    it('should remove a member from group', async () => {
      const group = groupRepository.create({
        name: 'Test Group',
        description: 'Test Description',
        isPrivate: false,
        ownerId: 'user1'
      } as Partial<Group> as any);
      const savedGroup = await groupRepository.save(group);
      const groupEntity = Array.isArray(savedGroup) ? savedGroup[0] : savedGroup;

      const member = memberRepository.create({
        groupId: groupEntity.id,
        userId: 'user2',
        role: 'member'
      } as any);
      await memberRepository.save(member);

      await request(app.getHttpServer())
        .delete(`/groups/${groupEntity.id}/members/user2`)
        .expect(200);

      // メンバーが削除されたことを確認
      const response = await request(app.getHttpServer())
        .get(`/groups/${groupEntity.id}/members`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should return 404 when group not found', async () => {
      await request(app.getHttpServer())
        .delete('/groups/999999/members/user2')
        .expect(404);
    });
  });
});
