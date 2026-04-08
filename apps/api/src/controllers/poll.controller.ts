import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PollService } from '../services/poll.service';

@Controller('rooms')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Post(':roomId/polls')
  async createPoll(
    @Param('roomId') roomId: string,
    @Body('question') question: string,
    @Body('options') options: string[],
    @Body('adminId') adminId: string, // In a real app we'd get this from request user, but for simplicity
  ) {
    return this.pollService.createPoll(roomId, adminId, question, options);
  }

  @Post('polls/:pollId/answers')
  async submitAnswer(
    @Param('pollId') pollId: string,
    @Body('userId') userId: string,
    @Body('optionId') optionId: string,
  ) {
    return this.pollService.submitAnswer(pollId, userId, optionId);
  }

  @Get(':roomId/polls')
  async getRoomPolls(@Param('roomId') roomId: string) {
    // Allows admin to get past polls and current poll in a room
    const polls = await this.pollService.getRoomPolls(roomId);
    
    // Also fetch results for each poll
    const pollsWithResults = await Promise.all(
      polls.map(async (poll) => {
        const results = await this.pollService.getPollResults(poll.id);
        return { ...poll, results };
      })
    );
    return pollsWithResults;
  }

  @Get('polls/:pollId/detailed-report')
  async getDetailedReport(@Param('pollId') pollId: string) {
    return this.pollService.getDetailedPollResults(pollId);
  }

  @Delete('polls/:pollId')
  async deletePoll(@Param('pollId') pollId: string) {
    return this.pollService.deletePoll(pollId);
  }
}
