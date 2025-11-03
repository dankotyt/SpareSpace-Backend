import { Controller, Post, Body, Get, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SearchReviewsDto } from './dto/search-reviews.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(201)
  create(@Body() createReviewDto: CreateReviewDto, @User('userId') userId: number) {
    return this.reviewsService.create(createReviewDto, userId);
  }

  @Get()
  findAll(@Query() searchDto: SearchReviewsDto) {
    return this.reviewsService.findAll(searchDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }
}
