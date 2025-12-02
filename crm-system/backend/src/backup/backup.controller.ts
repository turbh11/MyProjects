import { Controller, Post } from '@nestjs/common';
import { CloudBackupService } from './cloud-backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: CloudBackupService) {}

  @Post('manual')
  async createManualBackup() {
    try {
      const fileName = await this.backupService.createManualBackup();
      return { 
        message: 'גיבוי נוצר בהצלחה', 
        fileName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        message: 'שגיאה ביצירת הגיבוי', 
        error: error.message 
      };
    }
  }
}