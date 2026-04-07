import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollEntity } from '../entities/poll.entity';
import { PollOptionEntity } from '../entities/poll-option.entity';
import { PollAnswerEntity } from '../entities/poll-answer.entity';
import { RoomGateway } from '../gateways/room.gateway';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(PollEntity)
    private pollRepository: Repository<PollEntity>,
    @InjectRepository(PollAnswerEntity)
    private answerRepository: Repository<PollAnswerEntity>,
    private roomGateway: RoomGateway,
  ) {}

  async createPoll(roomId: string, adminId: string, question: string, options: string[]) {
    const poll = new PollEntity();
    poll.roomId = roomId;
    poll.createdBy = adminId;
    poll.question = question;
    poll.options = options.map(text => {
      const option = new PollOptionEntity();
      option.text = text;
      return option;
    });

    const savedPoll = await this.pollRepository.save(poll);

    // Notify room participants
    this.roomGateway.server.to(roomId).emit('new_poll', savedPoll);

    return savedPoll;
  }

  async submitAnswer(pollId: string, userId: string, optionId: string) {
    const poll = await this.pollRepository.findOne({ where: { id: pollId }, relations: ['options'] });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const isValidOption = poll.options.some(opt => opt.id === optionId);
    if (!isValidOption) {
      throw new NotFoundException('Option not found in the poll');
    }

    let answer = await this.answerRepository.findOne({ where: { pollId, userId } });
    if (!answer) {
      answer = new PollAnswerEntity();
      answer.pollId = pollId;
      answer.userId = userId;
    }
    answer.optionId = optionId;

    await this.answerRepository.save(answer);

    // Get current results and send them to the admin room only (we can emit to all, but frontend will only show Admin)
    const results = await this.getPollResults(pollId);
    this.roomGateway.server.to(poll.roomId).emit('poll_results_update', { pollId, results });

    return answer;
  }

  async getPollResults(pollId: string) {
    const answers = await this.answerRepository.find({ where: { pollId } });
    const results: Record<string, number> = {};
    for (const answer of answers) {
      results[answer.optionId] = (results[answer.optionId] || 0) + 1;
    }
    return results;
  }

  async getRoomPolls(roomId: string) {
    return this.pollRepository.find({
      where: { roomId },
      relations: ['options'],
      order: { createdAt: 'DESC' },
    });
  }
}
