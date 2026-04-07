import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth (POST)', () => {
    it('/api/auth/login - should login with root credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: '11111', password: 'root' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('username', '11111');

      token = response.body.accessToken;
    });

    it('/api/auth/login - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: '11111', password: 'wrongpassword' })
        .expect(401);
    });

    it('/api/auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: `testuser${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('/api/users (GET)', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('should return users with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('/api/roles (GET)', () => {
    it('should return roles with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should refresh tokens', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: '11111', password: 'root' });

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });
  });
});