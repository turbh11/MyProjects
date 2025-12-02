import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  create(createTaskDto: any) {
    const task = this.tasksRepository.create(createTaskDto);
    return this.tasksRepository.save(task);
  }

  // בתוך TasksService, עדכן את findAll:
  findAll() {
    return this.tasksRepository.find({
      relations: ['project'], // <--- חשוב מאוד! טוען את הפרויקט הקשור
      order: {
        isDone: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  // פונקציה לסימון כבוצע/לא בוצע
  async toggleDone(id: number) {
    const task = await this.tasksRepository.findOneBy({ id });
    if (task) {
      task.isDone = !task.isDone;
      return this.tasksRepository.save(task);
    }
    return null;
  }

  remove(id: number) {
    return this.tasksRepository.delete(id);
  }
}