import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { getSchemaPath } from '@nestjs/swagger';

import { ListingsService } from './listings.service';
import { Listing } from '../entities/listing.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { User } from '../common/decorators/user.decorator';

import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создание нового объявления',
    description: 'Создаёт объявление на основе предоставленных данных. Требует аутентификации.',
  })
  @ApiBody({ type: CreateListingDto, description: 'Данные для создания объявления' })
  @ApiCreatedResponse({ description: 'Объявление успешно создано', type: Listing, })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createListingDto: CreateListingDto,
    @User('userId') userId: number,
  ): Promise<Listing> {
    return this.listingsService.create(createListingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновление объявления',
    description:
      'Обновляет существующее объявление. Требует аутентификации и владения объявлением.',
  })
  @ApiParam({ name: 'id', description: 'ID объявления для обновления', type: Number })
  @ApiBody({ type: UpdateListingDto, description: 'Данные для обновления' })
  @ApiOkResponse({ description: 'Объявление успешно обновлено', type: Listing, })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @User('userId') userId: number,
  ): Promise<Listing> {
    return this.listingsService.update(+id, updateListingDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Удаление объявления',
    description:
      'Выполняет soft-delete объявления путём установки статуса INACTIVE. Требует аутентификации и владения объявлением.',
  })
  @ApiParam({ name: 'id', description: 'ID объявления для удаления', type: Number })
  @ApiNoContentResponse({ description: 'Объявление успешно удалено (soft-delete)' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async remove(@Param('id') id: string, @User('userId') userId: number): Promise<void> {
    return this.listingsService.remove(+id, userId);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение списка объявлений с поиском',
    description:
      'Возвращает список объявлений с фильтрацией по критериям поиска. Аутентификация не требуется.',
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchListingsDto,
    required: false,
    description: 'Критерии поиска (тип, цена, геолокация и т.д.)',
  })
  @ApiOkResponse({
    description: 'Список объявлений',
    schema: {
      type: 'object',
      properties: {
        listings: { type: 'array', items: { $ref: getSchemaPath(Listing) } },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query() searchDto: SearchListingsDto,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    return this.listingsService.findAll(searchDto);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение одного объявления (авторизация опциональна)',
    description:
      'Возвращает детали объявления. Аутентификация позволяет получить дополнительные данные владельца.',
  })
  @ApiParam({ name: 'id', description: 'ID объявления', type: Number })
  @ApiOkResponse({
    description: 'Объявление найдено',
    type: Listing,
  })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async findOne(@Param('id') id: string, @User('userId') userId?: number): Promise<Listing> {
    return this.listingsService.findOne(+id, userId);
  }

  @UseGuards(OptionalJwtGuard)
  @Get('user/:id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение объявлений пользователя (авторизация опциональна)',
    description:
      'Возвращает список объявлений указанного пользователя с фильтрацией. Аутентификация позволяет фильтровать приватные данные.',
  })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiQuery({
    name: 'searchDto',
    type: SearchListingsDto,
    required: false,
    description: 'Критерии поиска для объявлений пользователя',
  })
  @ApiOkResponse({
    description: 'Пагинированный список объявлений пользователя',
    schema: {
      type: 'object',
      properties: {
        listings: { type: 'array', items: { $ref: getSchemaPath(Listing) } },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  async findByUser(
    @Param('id') userId: string,
    @Query() searchDto: SearchListingsDto,
    @User('userId') currentUserId?: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    return this.listingsService.findByUser(+userId, searchDto, currentUserId);
  }
}
