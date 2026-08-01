import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller({
  path: 'organizations',
  version: '1',
})
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get the authenticated user organization',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'Organization was not found',
  })
  getCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findCurrent(currentUser.organizationId);
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({
    summary: 'Update the authenticated user organization',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  @ApiNotFoundResponse({
    description: 'Organization was not found',
  })
  updateCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.updateCurrent(
      currentUser.organizationId,
      updateOrganizationDto,
    );
  }
}
