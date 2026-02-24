import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { Prisma, Source, SourceStatus } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceListParams {
  type?: string;
  region?: string;
  enabled?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSourceResult {
  data: Source[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// SourceService
// ---------------------------------------------------------------------------

export class SourceService {
  /**
   * List only enabled sources (for the fetch pipeline and public API).
   */
  static async listEnabled(): Promise<Source[]> {
    return prisma.source.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * List all sources with optional filters and pagination (admin).
   */
  static async listAll(
    params: SourceListParams = {}
  ): Promise<PaginatedSourceResult> {
    const { type, region, enabled, status, page = 1, limit = 50 } = params;

    const where: Prisma.SourceWhereInput = {};

    if (type) where.type = type as Prisma.EnumSourceTypeFilter["equals"];
    if (region) where.region = region;
    if (enabled !== undefined) where.enabled = enabled;
    if (status)
      where.status = status as Prisma.EnumSourceStatusFilter["equals"];

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.source.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          _count: { select: { articles: true, fetchLogs: true } },
        },
      }),
      prisma.source.count({ where }),
    ]);

    return {
      data: data as Source[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new source.
   */
  static async create(data: Prisma.SourceCreateInput): Promise<Source> {
    return prisma.source.create({ data });
  }

  /**
   * Update an existing source by ID.
   */
  static async update(
    id: string,
    data: Prisma.SourceUpdateInput
  ): Promise<Source> {
    const existing = await prisma.source.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("Source not found", 404);
    }

    return prisma.source.update({ where: { id }, data });
  }

  /**
   * Delete a source by ID.
   * Cascades to related articles and fetch logs via Prisma schema.
   */
  static async delete(id: string): Promise<Source> {
    const existing = await prisma.source.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("Source not found", 404);
    }

    return prisma.source.delete({ where: { id } });
  }

  /**
   * Mark a source as successfully fetched.
   * Updates lastFetchedAt to now and sets status to ACTIVE.
   */
  static async markFetched(id: string): Promise<Source> {
    return prisma.source.update({
      where: { id },
      data: {
        lastFetchedAt: new Date(),
        status: "ACTIVE" as SourceStatus,
      },
    });
  }

  /**
   * Mark a source as having encountered an error during fetch.
   * Sets status to ERROR so it can be reviewed by an admin.
   */
  static async markError(id: string): Promise<Source> {
    return prisma.source.update({
      where: { id },
      data: {
        status: "ERROR" as SourceStatus,
      },
    });
  }
}
