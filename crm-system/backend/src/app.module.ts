import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule'; // <--- חובה כאן
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ProjectsModule } from './projects/projects.module';
import { PaymentsModule } from './payments/payments.module';
import { VisitsModule } from './visits/visits.module';
import { TasksModule } from './tasks/tasks.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SettingsModule } from './settings/settings.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BackupModule } from './backup/backup.module';
import { TaxModule } from './tax/tax.module';
import { MessagingModule } from './messaging/messaging.module';
import { BusinessExpensesModule } from './expenses/business-expenses.module';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notifications/notification.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ScheduleModule.forRoot(), // מושבת זמנית עקב בעיית crypto
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db', 
      port: 5432,
      username: 'myuser',
      password: 'mypassword',
      database: 'crm_database',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ProjectsModule,
    PaymentsModule,
    VisitsModule,
    TasksModule,
    AttachmentsModule,
    SettingsModule,
    ExpensesModule,
    BackupModule,
    TaxModule,
    MessagingModule,
    BusinessExpensesModule,
    EmailModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}