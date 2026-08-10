import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { PipelineStageResponseDto } from './dto/pipeline-stage-response.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { PipelineStagesRepository } from './pipeline-stages.repository';

@Injectable()
export class PipelineStagesService {
  constructor(
    private readonly pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async list(
    tenantId: string,
    actorUserId: string,
  ): Promise<PipelineStageResponseDto[]> {
    let stages = await this.pipelineStagesRepository.list(tenantId);

    if (stages.length === 0) {
      await this.pipelineStagesRepository.createDefaults(tenantId, actorUserId);

      stages = await this.pipelineStagesRepository.list(tenantId);
    }

    return stages.map((stage) => PipelineStageResponseDto.fromEntity(stage));
  }

  async findById(
    tenantId: string,
    stageId: string,
  ): Promise<PipelineStageResponseDto> {
    const stage = await this.pipelineStagesRepository.findById(
      tenantId,
      stageId,
    );

    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }

    return PipelineStageResponseDto.fromEntity(stage);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreatePipelineStageDto,
  ): Promise<PipelineStageResponseDto> {
    const name = this.normalizeName(dto.name);

    const isWon = dto.isWon ?? false;

    const isClosed = isWon ? true : (dto.isClosed ?? false);

    const probability = this.resolveProbability({
      probability: dto.probability,
      isClosed,
      isWon,
    });

    await this.ensureNameAvailable(tenantId, name);

    await this.ensurePositionAvailable(tenantId, dto.position);

    try {
      const stage = await this.pipelineStagesRepository.create({
        tenantId,
        actorUserId,
        name,
        position: dto.position,
        probability,
        isClosed,
        isWon,
        isActive: dto.isActive ?? true,
      });

      return PipelineStageResponseDto.fromEntity(stage);
    } catch (error: unknown) {
      if (this.getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'A pipeline stage with this name or position already exists',
        );
      }

      throw error;
    }
  }

  async update(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    dto: UpdatePipelineStageDto,
  ): Promise<PipelineStageResponseDto> {
    const existing = await this.pipelineStagesRepository.findById(
      tenantId,
      stageId,
    );

    if (!existing) {
      throw new NotFoundException('Pipeline stage not found');
    }

    const name =
      dto.name !== undefined ? this.normalizeName(dto.name) : undefined;

    if (name !== undefined && name !== existing.name) {
      await this.ensureNameAvailable(tenantId, name, stageId);
    }

    if (dto.position !== undefined && dto.position !== existing.position) {
      await this.ensurePositionAvailable(tenantId, dto.position, stageId);
    }

    const isWon = dto.isWon ?? existing.isWon;

    let isClosed = dto.isClosed ?? existing.isClosed;

    if (isWon) {
      isClosed = true;
    }

    const probability = this.resolveProbability({
      probability: dto.probability ?? existing.probability,
      isClosed,
      isWon,
    });

    try {
      const updated = await this.pipelineStagesRepository.update(
        tenantId,
        stageId,
        actorUserId,
        {
          name,
          position: dto.position,
          probability,
          isClosed,
          isWon,
          isActive: dto.isActive,
        },
      );

      if (!updated) {
        throw new NotFoundException('Pipeline stage not found');
      }

      return PipelineStageResponseDto.fromEntity(updated);
    } catch (error: unknown) {
      if (this.getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'A pipeline stage with this name or position already exists',
        );
      }

      throw error;
    }
  }

  async updateStatus(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<PipelineStageResponseDto> {
    const updated = await this.pipelineStagesRepository.updateStatus(
      tenantId,
      stageId,
      actorUserId,
      isActive,
    );

    if (!updated) {
      throw new NotFoundException('Pipeline stage not found');
    }

    return PipelineStageResponseDto.fromEntity(updated);
  }

  private resolveProbability({
    probability,
    isClosed,
    isWon,
  }: {
    probability: number | undefined;

    isClosed: boolean;
    isWon: boolean;
  }): number {
    if (isWon) {
      return 100;
    }

    if (isClosed) {
      return 0;
    }

    const value = probability ?? 0;

    if (value < 0 || value > 100) {
      throw new BadRequestException('Probability must be between 0 and 100');
    }

    return value;
  }

  private async ensureNameAvailable(
    tenantId: string,
    name: string,
    ignoreStageId?: string,
  ): Promise<void> {
    const existing = await this.pipelineStagesRepository.findByName(
      tenantId,
      name,
    );

    if (existing && existing.id !== ignoreStageId) {
      throw new ConflictException(
        'A pipeline stage with this name already exists',
      );
    }
  }

  private async ensurePositionAvailable(
    tenantId: string,
    position: number,
    ignoreStageId?: string,
  ): Promise<void> {
    const existing = await this.pipelineStagesRepository.findByPosition(
      tenantId,
      position,
    );

    if (existing && existing.id !== ignoreStageId) {
      throw new ConflictException(
        'A pipeline stage already uses this position',
      );
    }
  }

  private normalizeName(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Pipeline stage name is required');
    }

    return normalized;
  }

  private getDatabaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const record = error as {
      code?: unknown;
      cause?: unknown;
    };

    if (typeof record.code === 'string') {
      return record.code;
    }

    if (
      typeof record.cause === 'object' &&
      record.cause !== null &&
      'code' in record.cause
    ) {
      const cause = record.cause as {
        code?: unknown;
      };

      if (typeof cause.code === 'string') {
        return cause.code;
      }
    }

    return undefined;
  }
}
