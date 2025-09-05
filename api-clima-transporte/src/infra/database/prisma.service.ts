import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Tipagem do $on pode falhar antes da geração do Prisma Client.
    // Usamos type assertion para evitar erro de compilação durante o bootstrap inicial.
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
