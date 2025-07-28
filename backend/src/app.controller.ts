import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString()
    };
  }

  @Get()
  getHello(): string {
    return `
      <html>
        <head><title>Notetree Backend</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🌲 Notetree Backend</h1>
          <p>Backend Status: ✅ Running</p>
          <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;">
            <h3>Available Endpoints:</h3>
            <ul>
              <li><a href="/groups">GET /groups - List all groups</a></li>
              <li>POST /groups - Create new group</li>
              <li>GET /groups/:id - Get group by ID</li>
            </ul>
          </div>
          <p>Service: ${this.appService.getHello()}</p>
        </body>
      </html>
    `;
  }
}
