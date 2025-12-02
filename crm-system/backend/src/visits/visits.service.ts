import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm'; // <--- שים לב לתוספת של MoreThanOrEqual
import { Visit } from './entities/visit.entity';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
  ) {}

  create(createVisitDto: any) {
    const visit = this.visitsRepository.create({
      ...createVisitDto,
      visitDate: createVisitDto.visitDate ? new Date(createVisitDto.visitDate) : new Date(),
    });
    return this.visitsRepository.save(visit);
  }

  findAllByProject(projectId: number) {
    return this.visitsRepository.find({
      where: { projectId },
      order: { visitDate: 'DESC' }
    });
  }

  // --- הפונקציה החדשה ---
  findUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // איפוס השעה לתחילת היום

    return this.visitsRepository.find({
      where: {
        visitDate: MoreThanOrEqual(today), // תאריך של היום או עתיד
      },
      relations: ['project'], // חשוב! כדי שנראה את שם הלקוח ולא רק מספר פרויקט
      order: {
        visitDate: 'ASC', // הקרוב ביותר ראשון
      },
    });
  }
}