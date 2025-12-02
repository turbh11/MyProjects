import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './project.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Visit } from '../visits/entities/visit.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Attachment, Task, Payment, Visit]), 
    SettingsModule
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}