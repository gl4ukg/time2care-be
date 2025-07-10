// src/shift/shift.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ShiftService {
  private prisma = new PrismaClient();

  async createShift(data: any, companyId: string) {
    return this.prisma.shift.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getAllShifts() {
    return this.prisma.shift.findMany({
      include: {
        company: {
          select: { email: true, id: true },
        },
      },
    });
  }

  async applyToShift(shiftId: string, userId: string, note?: string) {
    // prevent double application
    const existing = await this.prisma.application.findFirst({
      where: { shiftId, userId },
    });
    if (existing) throw new ForbiddenException('Already applied.');

    return this.prisma.application.create({
      data: {
        shiftId,
        userId,
        note,
      },
    });
  }

  async getCompanyShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { companyId },
      include: {
        applications: {
          include: {
            user: { select: { email: true, id: true } },
          },
        },
      },
    });
  }
}
