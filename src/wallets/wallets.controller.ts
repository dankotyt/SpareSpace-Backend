import { Controller, Get, Post, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { GetBalancesDto } from './dto/get-balances.dto';
import { TopupDto } from './dto/topup.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  @HttpCode(200)
  getMyWallet(@User('userId') userId: number) {
    return this.walletsService.getWalletByUserId(userId);
  }

  @Get('me/balances')
  @HttpCode(200)
  getMyBalances(@Query() getBalancesDto: GetBalancesDto, @User('userId') userId: number) {
    return this.walletsService.getBalances(userId, getBalancesDto);
  }

  @Post('topup')
  @HttpCode(200)
  topup(@Body() topupDto: TopupDto, @User('userId') userId: number) {
    return this.walletsService.topup(userId, topupDto);
  }

  @Post('withdraw')
  @HttpCode(200)
  withdraw(@Body() withdrawDto: WithdrawDto, @User('userId') userId: number) {
    return this.walletsService.withdraw(userId, withdrawDto);
  }

  @Post('transfer')
  @HttpCode(200)
  transfer(@Body() transferDto: TransferDto, @User('userId') userId: number) {
    return this.walletsService.transfer(userId, transferDto);
  }
}
