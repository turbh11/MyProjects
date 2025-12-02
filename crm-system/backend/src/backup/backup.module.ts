import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudBackupService } from './cloud-backup.service';
import { BackupController } from './backup.controller';
import { Project } from '../projects/project.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attachment } from '../attachments/entities/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Payment, Expense, Attachment])
  ],
  providers: [CloudBackupService],
  controllers: [BackupController],
  exports: [CloudBackupService],
})
export class BackupModule {}