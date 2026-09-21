import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/welcome (GET)', () => {
    return request(app.getHttpServer())
      .get('/welcome')
      .expect(200)
      .expect((response) => {
        if (!response.text.includes('Now Nest can react')) {
          throw new Error('Expected welcome tagline in HTML');
        }

        if (!response.text.includes('Nest owns')) {
          throw new Error('Expected welcome headline in HTML');
        }
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
