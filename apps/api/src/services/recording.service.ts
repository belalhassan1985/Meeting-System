import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingEntity, RecordingStatus } from '../entities/recording.entity';
import { RoomEntity } from '../entities/room.entity';
import { EgressClient, RoomCompositeEgressRequest, EncodedFileOutput } from 'livekit-server-sdk';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private egressClient: EgressClient;

  constructor(
    @InjectRepository(RecordingEntity)
    private recordingRepository: Repository<RecordingEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
  ) {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    if (!apiKey || !apiSecret) {
      this.logger.warn('LiveKit credentials not configured. Recording will not be available.');
    } else {
      this.egressClient = new EgressClient(livekitUrl, apiKey, apiSecret);
      this.logger.log('Recording service initialized with LiveKit Egress');
    }
  }

  async startRecording(roomId: string, userId: string): Promise<RecordingEntity> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check for active recording
    const activeRecording = await this.recordingRepository.findOne({
      where: { 
        roomId, 
        status: RecordingStatus.ACTIVE 
      },
    });

    if (activeRecording) {
      // Auto-cleanup old active recording (likely from previous session that didn't stop properly)
      this.logger.warn(`Found orphaned active recording ${activeRecording.id}, marking as failed`);
      activeRecording.status = RecordingStatus.FAILED;
      activeRecording.errorMessage = 'Recording was not properly stopped';
      activeRecording.endedAt = new Date();
      await this.recordingRepository.save(activeRecording);
    }

    // Local recording: Create recording entry, client will handle actual recording
    const fileName = `recording-${roomId}-${Date.now()}.webm`;
    
    const recording = this.recordingRepository.create({
      roomId,
      startedBy: userId,
      status: RecordingStatus.ACTIVE,
      fileName,
      egressId: `local-${Date.now()}`, // Local recording identifier
    });

    await this.recordingRepository.save(recording);
    this.logger.log(`Local recording started for room ${roomId}`);
    return recording;
  }

  async stopRecording(recordingId: string, userId: string): Promise<RecordingEntity> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.status !== RecordingStatus.ACTIVE) {
      throw new BadRequestException('Recording is not active');
    }

    // Local recording: Mark as stopping, client will upload file
    recording.status = RecordingStatus.STOPPING;
    recording.endedAt = new Date();
    
    const duration = Math.floor(
      (recording.endedAt.getTime() - recording.startedAt.getTime()) / 1000
    );
    recording.duration = duration;

    await this.recordingRepository.save(recording);
    this.logger.log(`Local recording stopped for recordingId ${recordingId}`);
    return recording;
  }

  async completeRecording(recordingId: string, fileUrl: string, fileSize: number): Promise<RecordingEntity> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    recording.status = RecordingStatus.COMPLETED;
    recording.fileUrl = fileUrl;
    recording.fileSize = fileSize;

    await this.recordingRepository.save(recording);
    this.logger.log(`Recording completed: ${recordingId}`);
    return recording;
  }

  async getRecordingsByRoom(roomId: string): Promise<RecordingEntity[]> {
    return this.recordingRepository.find({
      where: { roomId },
      order: { startedAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getActiveRecording(roomId: string): Promise<RecordingEntity | null> {
    return this.recordingRepository.findOne({
      where: { 
        roomId, 
        status: RecordingStatus.ACTIVE 
      },
    });
  }

  async getAllRecordings(page = 1, limit = 20): Promise<{ recordings: RecordingEntity[]; total: number }> {
    try {
      const [recordings, total] = await this.recordingRepository.findAndCount({
        order: { startedAt: 'DESC' },
        relations: ['room', 'user'],
        skip: (page - 1) * limit,
        take: limit,
      });

      this.logger.log(`Found ${recordings.length} recordings (total: ${total})`);
      return { recordings, total };
    } catch (error) {
      this.logger.error('Error fetching recordings:', error);
      // If relations fail, try without them
      const [recordings, total] = await this.recordingRepository.findAndCount({
        order: { startedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { recordings, total };
    }
  }

  async deleteRecording(recordingId: string): Promise<void> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    await this.recordingRepository.remove(recording);
    this.logger.log(`Recording ${recordingId} deleted`);
  }

  async updateRecordingStatus(egressId: string, status: RecordingStatus, fileUrl?: string, fileSize?: number): Promise<void> {
    const recording = await this.recordingRepository.findOne({
      where: { egressId },
    });

    if (recording) {
      recording.status = status;
      if (fileUrl) recording.fileUrl = fileUrl;
      if (fileSize) recording.fileSize = fileSize;
      if (status === RecordingStatus.COMPLETED) {
        recording.endedAt = new Date();
        recording.duration = Math.floor(
          (recording.endedAt.getTime() - recording.startedAt.getTime()) / 1000
        );
      }
      await this.recordingRepository.save(recording);
    }
  }
}
