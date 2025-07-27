import { Controller, Get, Post, Query, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InvitationService } from './invitation.service';

@Controller('invitations')
export class InvitationController {
  private readonly logger = new Logger(InvitationController.name);

  constructor(private readonly invitationService: InvitationService) {}

  @Get('accept')
  async acceptInvitation(@Query('token') token: string) {
    try {
      this.logger.log(`GET /invitations/accept called with token: ${token}`);
      if (!token) {
        throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
      }
      
      const member = await this.invitationService.acceptInvitation(token);
      return {
        success: true,
        data: member,
        message: 'Invitation accepted successfully'
      };
    } catch (error) {
      this.logger.error(`Error accepting invitation: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to accept invitation',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/cancel')
  async cancelInvitation(@Param('id') invitationId: string, @Query('userId') userId: string) {
    try {
      this.logger.log(`POST /invitations/${invitationId}/cancel called`);
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      
      await this.invitationService.cancelInvitation(invitationId, userId);
      return {
        success: true,
        message: 'Invitation canceled successfully'
      };
    } catch (error) {
      this.logger.error(`Error canceling invitation: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to cancel invitation',
          error: error.name
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 
