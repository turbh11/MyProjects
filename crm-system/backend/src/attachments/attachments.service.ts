import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { Folder } from './entities/folder.entity';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private repo: Repository<Attachment>,
    @InjectRepository(Folder)
    private folderRepo: Repository<Folder>,
  ) {}

  create(data: any) {
    const attachment = this.repo.create(data);
    return this.repo.save(attachment);
  }

  async findAllByProject(projectId: number, folderId: number | null = null) {
    console.log(`🔍 טוען קבצים לפרויקט ${projectId}, תיקייה: ${folderId}`);
    
    // החזרת קבצים ותיקיות של תיקייה ספציפית או הרמה הראשית
    const files = await this.repo.find({ 
      where: { 
        projectId, 
        folderId: folderId === null ? IsNull() : folderId 
      }, 
      order: { uploadDate: 'DESC' } 
    });
    
    const folders = await this.folderRepo.find({ 
      where: { 
        projectId, 
        parentId: folderId === null ? IsNull() : folderId 
      }, 
      order: { createdAt: 'DESC' } 
    });
    
    console.log(`📁 נמצאו ${folders.length} תיקיות, ${files.length} קבצים`);
    
    // הוספת type לזיהוי
    const filesWithType = files.map(file => ({ ...file, type: 'file' }));
    const foldersWithType = folders.map(folder => ({ 
      ...folder, 
      type: 'folder',
      originalName: folder.name, // להתאמה לממשק
      filename: 'folder', // לזיהוי
      uploadDate: folder.createdAt
    }));
    
    return [...foldersWithType, ...filesWithType];
  }
  
  remove(id: number) {
    return this.repo.delete(id);
  }

  async downloadZip(fileIds: number[], res: Response) {
  const files = await this.repo.findByIds(fileIds);
  if (files.length === 0) return;

  const archive = archiver('zip', { zlib: { level: 9 } });

  res.attachment('files.zip'); // שם הקובץ שיורד
  archive.pipe(res);

  files.forEach(file => {
    const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
    if (fs.existsSync(filePath)) {
      // מוסיף את הקובץ לתוך ה-ZIP בשם המקורי שלו
      archive.file(filePath, { name: file.originalName });
    }
  });

  await archive.finalize();
}

  async downloadZipWithFolders(fileIds: number[], folderIds: number[], res: Response) {
    try {
      console.log(`📦 יצירת ZIP עם קבצים: ${fileIds.join(',')} ותיקיות: ${folderIds.join(',')}`);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="files_and_folders.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      // הוספת קבצים נבחרים
      if (fileIds.length > 0) {
        const selectedFiles = await this.repo.findByIds(fileIds);
        selectedFiles.forEach(file => {
          const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file.originalName });
          }
        });
      }

      // הוספת תיקיות (רקורסיבית)
      for (const folderId of folderIds) {
        await this.addFolderToArchive(archive, folderId, '');
      }

      await archive.finalize();
    } catch (error) {
      console.error('❌ שגיאה ביצירת ZIP:', error);
      if (!res.headersSent) {
        res.status(500).send('שגיאה ביצירת הקובץ');
      }
    }
  }

  private async addFolderToArchive(archive: any, folderId: number, parentPath: string) {
    // מצא את פרטי התיקייה
    const folder = await this.folderRepo.findOne({ where: { id: folderId } });
    if (!folder) return;

    const currentPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
    
    // הוסף את כל הקבצים בתיקייה
    const files = await this.repo.find({ where: { folderId } });
    files.forEach(file => {
      const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `${currentPath}/${file.originalName}` });
      }
    });

    // הוסף תיקיות משנה באופן רקורסיבי
    const subFolders = await this.folderRepo.find({ where: { parentId: folderId } });
    for (const subFolder of subFolders) {
      await this.addFolderToArchive(archive, subFolder.id, currentPath);
    }
  }

  async downloadSingle(fileId: number, res: Response) {
    try {
      const file = await this.repo.findOne({ where: { id: fileId } });
      if (!file) {
        console.log(`❌ קובץ לא נמצא: ${fileId}`);
        return res.status(404).send('קובץ לא נמצא');
      }

      const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
      console.log(`🔍 מחפש קובץ: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ קובץ פיזי לא נמצא: ${filePath}`);
        return res.status(404).send('קובץ פיזי לא נמצא');
      }

      console.log(`✅ מוריד קובץ: ${file.originalName}`);
      
      // הגדרת כותרות מפורשות להורדה - עם encoding נכון
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      
      // שליחת הקובץ
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('❌ שגיאה בשליחת הקובץ:', error);
        if (!res.headersSent) {
          res.status(500).send('שגיאה בהורדת הקובץ');
        }
      });
      
    } catch (error) {
      console.error('❌ שגיאה בdownloadSingle:', error);
      if (!res.headersSent) {
        res.status(500).send('שגיאה פנימית');
      }
    }
  }

  async createFolder(projectId: number, folderName: string, parentId?: number) {
    try {
      console.log(`📁 יצירת תיקייה: ${folderName} לפרויקט ${projectId}, תיקיית הורה: ${parentId || 'בית'}`);
      
      // יצירת תיקייה אמיתית במסד הנתונים
      const folderData: any = {
        name: folderName,
        projectId: projectId
      };
      
      if (parentId) {
        folderData.parentId = parentId;
      }
      
      const folder = this.folderRepo.create(folderData);
      
      const savedFolder = await this.folderRepo.save(folder);
      console.log(`✅ תיקייה נוצרה בהצלחה:`, savedFolder);
      
      return {
        success: true,
        message: `תיקיית "${folderName}" נוצרה בהצלחה`,
        folder: savedFolder
      };
      
    } catch (error) {
      console.error('❌ שגיאה בcreateFolder:', error);
      return {
        success: false,
        message: 'שגיאה ביצירת התיקייה: ' + error.message
      };
    }
  }

  async renameFile(fileId: number, newOriginalName: string): Promise<any> {
    try {
      console.log(`🔄 משנה שם קובץ ${fileId} ל-${newOriginalName}`);
      
      const file = await this.repo.findOne({ where: { id: fileId } });
      if (!file) {
        return {
          success: false,
          message: 'קובץ לא נמצא'
        };
      }

      // עדכון השם המקורי במסד הנתונים
      file.originalName = newOriginalName;
      await this.repo.save(file);
      
      console.log(`✅ שם קובץ ${fileId} שונה בהצלחה ל-${newOriginalName}`);
      return {
        success: true,
        message: 'שם הקובץ שונה בהצלחה',
        file
      };
      
    } catch (error) {
      console.error('❌ שגיאה בrenameFile:', error);
      return {
        success: false,
        message: 'שגיאה בשינוי שם הקובץ'
      };
    }
  }

  async deleteFolder(id: number): Promise<void> {
    try {
      console.log(`🗂️ מתחיל מחיקה רקורסיבית של תיקיה ${id}`);
      
      // בדיקה אם התיקיה קיימת
      const folder = await this.folderRepo.findOne({ where: { id } });
      if (!folder) {
        console.error(`❌ תיקיה ${id} לא נמצאה במסד הנתונים`);
        throw new Error('תיקיה לא נמצאה');
      }
      
      console.log(`📁 נמצאה תיקיה: ${folder.name}, parentId: ${folder.parentId}`);
      
      // מחיקה רקורסיבית של כל התיקיות והקבצים בפנים
      await this.deleteFolderRecursively(id);
      console.log(`✅ מחיקת תיקיה ${id} הושלמה בהצלחה`);
    } catch (error) {
      console.error(`❌ שגיאה במחיקת תיקיה ${id}:`, error);
      throw error;
    }
  }

  private async deleteFolderRecursively(folderId: number): Promise<void> {
    console.log(`🔍 מחיקה רקורסיבית של תיקיה ${folderId}`);
    
    // מחיקת כל הקבצים בתיקיה
    const attachments = await this.repo.find({ where: { folderId } });
    console.log(`📎 נמצאו ${attachments.length} קבצים בתיקיה ${folderId}`);
    
    for (const attachment of attachments) {
      console.log(`🗑️ מוחק קובץ ${attachment.id} - ${attachment.originalName}`);
      await this.remove(attachment.id);
    }

    // מחיקת כל התיקיות הילד
    const childFolders = await this.folderRepo.find({ where: { parentId: folderId } });
    console.log(`📁 נמצאו ${childFolders.length} תיקיות ילד בתיקיה ${folderId}`);
    
    for (const childFolder of childFolders) {
      console.log(`🔄 מחיקה רקורסיבית של תיקיית ילד ${childFolder.id} - ${childFolder.name}`);
      await this.deleteFolderRecursively(childFolder.id);
    }

    // מחיקת התיקיה עצמה
    console.log(`🗂️ מוחק את התיקיה ${folderId} עצמה`);
    const result = await this.folderRepo.delete(folderId);
    console.log(`✅ תוצאת מחיקת תיקיה ${folderId}:`, result);
  }

  async renameFolder(id: number, newName: string) {
    await this.folderRepo.update(id, { name: newName });
    return { success: true };
  }
}