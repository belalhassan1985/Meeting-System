import { Controller, Post, Get, Delete, Param, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Query, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { RecordingService } from '../services/recording.service';

@Controller('recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Post('start/:roomId')
  async startRecording(
    @Param('roomId') roomId: string,
    @Body('userId') userId: string,
  ) {
    return this.recordingService.startRecording(roomId, userId);
  }

  @Post('stop/:recordingId')
  async stopRecording(
    @Param('recordingId') recordingId: string,
    @Body('userId') userId: string,
  ) {
    return this.recordingService.stopRecording(recordingId, userId);
  }

  @Get('room/:roomId')
  async getRecordingsByRoom(@Param('roomId') roomId: string) {
    return this.recordingService.getRecordingsByRoom(roomId);
  }

  @Get('room/:roomId/active')
  async getActiveRecording(@Param('roomId') roomId: string) {
    return this.recordingService.getActiveRecording(roomId);
  }

  @Get()
  async getAllRecordings(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.recordingService.getAllRecordings(Number(page), Number(limit));
  }

  @Delete(':recordingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRecording(@Param('recordingId') recordingId: string) {
    await this.recordingService.deleteRecording(recordingId);
  }

  @Post('upload/:recordingId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/recordings',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `recording-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 500, // 500MB max
      },
    }),
  )
  async uploadRecording(
    @Param('recordingId') recordingId: string,
    @UploadedFile() file: any,
  ) {
    const fileUrl = `/api/recordings/download/${file.filename}`;
    const fileSize = file.size;
    return this.recordingService.completeRecording(recordingId, fileUrl, fileSize);
  }

  @Get('download/:filename')
  async downloadRecording(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads', 'recordings', filename);
    
    if (!existsSync(filePath)) {
      console.error('File not found:', filePath);
      throw new NotFoundException(`Recording file not found: ${filename}`);
    }
    
    return res.download(filePath, filename, (err: any) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        }
      }
    });
  }
}
