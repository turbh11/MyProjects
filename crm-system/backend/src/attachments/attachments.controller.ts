import { Controller, Get, Post, Put, Param, UseInterceptors, UploadedFile, Body, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { diskStorage, File as MulterFile } from 'multer';
import { extname } from 'path';
import { Res, Query } from '@nestjs/common';
import type { Response } from 'express';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        // שמירה בשם אקראי באנגלית כדי למנוע בעיות במערכת ההפעלה
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: MulterFile, @Body('projectId') projectId: string, @Body('folderId') folderId?: string) {
    console.log('קבלת בקשת העלאה:', {
      file: file ? { originalname: file.originalname, filename: file.filename } : 'לא נמצא',
      projectId,
      folderId
    });
    
    // --- התיקון לעברית מתחיל כאן ---
    // אנחנו מנסים לתקן את הקידוד. אם השם מגיע משובש, זה מסדר אותו.
    const fixedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const folderIdNum = folderId ? +folderId : null;
    // -----------------------------

    return this.attachmentsService.create({
      filename: file.filename,     // השם הפיזי (ג'יבריש אקראי בטוח)
      originalName: fixedOriginalName, // השם לתצוגה (עברית תקינה)
      projectId: +projectId,
      folderId: folderIdNum,       // התיקייה שבתוכה להעלות
    });
  }

  @Get('project/:id')
  findAllByProject(@Param('id') id: string, @Query('folderId') folderId?: string) {
    const folderIdNum = folderId && folderId !== '' ? +folderId : null;
    return this.attachmentsService.findAllByProject(+id, folderIdNum);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(+id);
  }

  @Get('download/:id')
  async downloadSingle(@Param('id') id: string, @Res() res: Response) {
    console.log(`🎯 Backend: בקשת הורדה לקובץ ${id}`);
    return this.attachmentsService.downloadSingle(+id, res);
  }

  @Get('download-zip')
async downloadZip(@Query('ids') ids: string, @Query('folderIds') folderIds: string = '', @Res() res: Response) {
  // ה-ids מגיעים כמחרוזת "1,2,3", נהפוך למערך מספרים
  const fileIdArray = ids ? ids.split(',').map(id => +id).filter(id => !isNaN(id)) : [];
  const folderIdArray = folderIds ? folderIds.split(',').map(id => +id).filter(id => !isNaN(id)) : [];
  return this.attachmentsService.downloadZipWithFolders(fileIdArray, folderIdArray, res);
}

  @Put(':id/rename')
  async renameFile(@Param('id') id: string, @Body() body: { originalName: string }) {
    return this.attachmentsService.renameFile(+id, body.originalName);
  }

  @Post('folder')
  async createFolder(@Body() body: { projectId: number, name: string, parentId?: number }) {
    return this.attachmentsService.createFolder(body.projectId, body.name, body.parentId);
  }

  @Delete('folder/:id')
  deleteFolder(@Param('id') id: string) {
    console.log(`🗑️ בקשת מחיקת תיקיה: ${id}`);
    return this.attachmentsService.deleteFolder(+id);
  }

  @Put('folder/:id/rename')
  renameFolder(@Param('id') id: string, @Body('name') newName: string) {
    return this.attachmentsService.renameFolder(+id, newName);
  }
}