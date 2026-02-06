import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Block } from "../../schemas/block.schema.js";
import { Appointment } from "../../schemas/appointment.schema.js";
import { CreateBlockDto } from "../dto/create-block.dto.js";
import { UpdateBlockDto } from "../dto/update-block.dto.js";
import {
  ERR_BLOCK_APPOINTMENT_CONFLICT,
  ERR_BLOCK_NOT_FOUND,
  ERR_INVALID_DATE_FORMAT,
  ERR_NO_UPDATES
} from "./admin.constants.js";
import { AdminBusinessContextService } from "./admin-business-context.service.js";
import { AdminCatalogService } from "./admin-catalog.service.js";

@Injectable()
export class AdminBlocksService {
  constructor(
    @InjectModel(Block.name) private readonly blockModel: Model<Block>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    private readonly businessContext: AdminBusinessContextService,
    private readonly catalogService: AdminCatalogService
  ) {}

  async listBlocks(
    businessId: string,
    resourceId?: string,
    from?: string,
    to?: string,
    search?: string,
    page?: number,
    limit?: number
  ) {
    await this.businessContext.getBusinessContext(businessId);
    const query: Record<string, unknown> = { businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
      }
      query.startTime = { $lt: end };
      query.endTime = { $gt: start };
    }
    if (search) {
      query.reason = { $regex: search.trim(), $options: "i" };
    }

    if (page && limit) {
      const total = await this.blockModel.countDocuments(query);
      const items = await this.blockModel
        .find(query)
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { items, total, page, limit };
    }

    return this.blockModel.find(query).sort({ startTime: -1 }).lean();
  }

  async createBlock(businessId: string, payload: CreateBlockDto) {
    await this.businessContext.getBusinessContext(businessId);

    if (payload.resourceId) {
      await this.catalogService.assertResource(businessId, payload.resourceId);
    }

    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException("Invalid date format.");
    }
    if (endTime <= startTime) {
      throw new BadRequestException("Block endTime must be after startTime.");
    }

    await this.ensureNoAppointmentConflict(businessId, startTime, endTime, payload.resourceId);

    return this.blockModel.create({
      businessId,
      resourceId: payload.resourceId,
      startTime,
      endTime,
      reason: payload.reason
    });
  }

  async updateBlock(
    businessId: string,
    blockId: string,
    payload: UpdateBlockDto,
    resourceId?: string
  ) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(blockId)) {
      throw new BadRequestException("Invalid blockId.");
    }

    if (resourceId && payload.resourceId) {
      throw new BadRequestException("Staff cannot update resourceId.");
    }

    if (payload.resourceId) {
      await this.catalogService.assertResource(businessId, payload.resourceId);
    }

    const update = this.parseBlockUpdate(payload);

    if (update.startTime && update.endTime) {
      await this.ensureNoAppointmentConflict(
        businessId,
        update.startTime as Date,
        update.endTime as Date,
        resourceId
      );
    }

    const query: Record<string, unknown> = { _id: blockId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    const updated = await this.blockModel.findOneAndUpdate(query, update, { new: true }).lean();
    if (!updated) {
      throw new NotFoundException(ERR_BLOCK_NOT_FOUND);
    }

    return updated;
  }

  async deleteBlock(businessId: string, blockId: string, resourceId?: string) {
    await this.businessContext.getBusinessContext(businessId);

    if (!isValidObjectId(blockId)) {
      throw new BadRequestException("Invalid blockId.");
    }

    const query: Record<string, unknown> = { _id: blockId, businessId };
    if (resourceId) {
      query.resourceId = resourceId;
    }

    const removed = await this.blockModel.findOneAndDelete(query).lean();
    if (!removed) {
      throw new NotFoundException(ERR_BLOCK_NOT_FOUND);
    }

    return removed;
  }

  private parseBlockUpdate(payload: UpdateBlockDto) {
    const update: Record<string, unknown> = { ...payload };
    if (payload.startTime) {
      const startTime = new Date(payload.startTime);
      if (Number.isNaN(startTime.getTime())) {
        throw new BadRequestException("Invalid startTime format.");
      }
      update.startTime = startTime;
    }
    if (payload.endTime) {
      const endTime = new Date(payload.endTime);
      if (Number.isNaN(endTime.getTime())) {
        throw new BadRequestException("Invalid endTime format.");
      }
      update.endTime = endTime;
    }
    if (Object.keys(update).length === 0) {
      throw new BadRequestException(ERR_NO_UPDATES);
    }
    if (update.startTime && update.endTime && update.endTime <= update.startTime) {
      throw new BadRequestException("Block endTime must be after startTime.");
    }
    return update;
  }

  private async ensureNoAppointmentConflict(
    businessId: string,
    startTime: Date,
    endTime: Date,
    resourceId?: string
  ) {
    const query: Record<string, unknown> = {
      businessId,
      status: "booked",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    const count = await this.appointmentModel.countDocuments(query);
    if (count > 0) {
      throw new BadRequestException(ERR_BLOCK_APPOINTMENT_CONFLICT);
    }
  }
}
