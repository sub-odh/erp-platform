import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db, organizations, type Organization } from '@erp/db';

import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  async findCurrent(organizationId: string): Promise<Organization> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async updateCurrent(
    organizationId: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...updateOrganizationDto,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrganization) {
      throw new NotFoundException('Organization not found');
    }

    return updatedOrganization;
  }
}
