import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { json } from 'express'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  app.use(json({ limit: '4kb' }))
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
  app.use((_request: unknown, response: { setHeader(name: string, value: string): void }, next: () => void) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })
  app.enableShutdownHooks()
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0')
}

void bootstrap()