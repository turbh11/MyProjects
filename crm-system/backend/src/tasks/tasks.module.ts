import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // חובה
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';   // חובה

@Module({
  imports: [TypeOrmModule.forFeature([Task])],   // <--- השורה הקריטית
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}