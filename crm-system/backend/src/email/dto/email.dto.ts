import { IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';
import { EmailType } from '../email.entity';

export class SendEmailDto {
  @IsString()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsEnum(EmailType)
  type?: EmailType;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    path: string;
    contentType: string;
  }>;
}

export class EmailTrackingDto {
  @IsString()
  trackingId: string;

  @IsString()
  action: 'open' | 'click';
}

// Type alias for compatibility
export type CreateEmailDto = SendEmailDto;