import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class CustomIoAdapter extends IoAdapter {
  private readonly options: any;

  constructor(app: INestApplicationContext, options: any) {
    super(app);
    this.options = options;
  }

  createIOServer(port: number): any {
    const server = super.createIOServer(port, this.options);
    return server;
  }
}
