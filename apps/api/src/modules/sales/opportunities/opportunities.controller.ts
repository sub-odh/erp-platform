import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { ChangeOpportunityStageDto } from './dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesFacade } from './opportunities.facade';

@ApiTags('Sales - Opportunities')
@ApiBearerAuth()
@Controller({
  path: 'sales/opportunities',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class OpportunitiesController {
  constructor(private readonly opportunitiesFacade: OpportunitiesFacade) {}

  @Get()
  list(
    @CurrentUser()
    currentUser: JwtPayload,

    @Query()
    query: ListOpportunitiesQueryDto,
  ) {
    return this.opportunitiesFacade.list(currentUser.organizationId, query);
  }

  @Get(':opportunityId')
  findById(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,
  ) {
    return this.opportunitiesFacade.findById(
      currentUser.organizationId,
      opportunityId,
    );
  }

  @Post()
  create(
    @CurrentUser()
    currentUser: JwtPayload,

    @Body()
    dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesFacade.create(
      currentUser.organizationId,
      currentUser.sub,
      dto,
    );
  }

  @Patch(':opportunityId')
  update(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,

    @Body()
    dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesFacade.update(
      currentUser.organizationId,
      opportunityId,
      currentUser.sub,
      dto,
    );
  }

  @Patch(':opportunityId/stage')
  changeStage(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,

    @Body()
    dto: ChangeOpportunityStageDto,
  ) {
    return this.opportunitiesFacade.changeStage(
      currentUser.organizationId,
      opportunityId,
      currentUser.sub,
      dto,
    );
  }

  @Post(':opportunityId/restore')
  restore(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,
  ) {
    return this.opportunitiesFacade.restore(
      currentUser.organizationId,
      opportunityId,
      currentUser.sub,
    );
  }

  @Delete(':opportunityId/permanent')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  permanentDelete(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,
  ): Promise<void> {
    return this.opportunitiesFacade.permanentDelete(
      currentUser.organizationId,
      opportunityId,
    );
  }

  @Delete(':opportunityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @CurrentUser()
    currentUser: JwtPayload,

    @Param('opportunityId', new ParseUUIDPipe())
    opportunityId: string,
  ): Promise<void> {
    return this.opportunitiesFacade.archive(
      currentUser.organizationId,
      opportunityId,
      currentUser.sub,
    );
  }
}
