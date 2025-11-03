import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { CreateUserSubscriptionDto } from './dto/create-user-subscription.dto';
import { SearchSubscriptionPlansDto } from './dto/search-subscription-plans.dto';
import { SearchUserSubscriptionsDto } from './dto/search-user-subscriptions.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Эндпоинты для планов (публичный поиск, админ-операции)

  @Get('plans')
  findAllPlans(@Query() searchDto: SearchSubscriptionPlansDto) {
    return this.subscriptionsService.findAllPlans(searchDto);
  }

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @HttpCode(201)
  createPlan(@Body() createDto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(createDto);
  }

  @Get('plans/:id')
  findPlanById(@Param('id') id: string) {
    return this.subscriptionsService.findPlanById(+id);
  }

  @Patch('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.ADMIN)
  updatePlan(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.updatePlan(+id, updateDto);
  }

  @Delete('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @HttpCode(204)
  deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(+id);
  }

  // Эндпоинты для пользовательских подписок

  @Get()
  findUserSubscriptions(@Query() searchDto: SearchUserSubscriptionsDto, @User('userId') userId: number) {
    return this.subscriptionsService.findUserSubscriptions(userId, searchDto);
  }

  @Get('active')
  findActiveSubscription(@User('userId') userId: number) {
    return this.subscriptionsService.findActiveSubscription(userId);
  }

  @Post()
  @HttpCode(201)
  createSubscription(@Body() createDto: CreateUserSubscriptionDto, @User('userId') userId: number) {
    return this.subscriptionsService.createSubscription(createDto, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(204)
  cancelSubscription(@Param('id') subscriptionPlanId: string, @User('userId') userId: number) {
    return this.subscriptionsService.cancelSubscription(+subscriptionPlanId, userId);
  }
}
