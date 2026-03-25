import { Injectable } from '@nestjs/common';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientsStats(req: RequestWithUser) {
    const org = req.organization;
    const orgId = org.id;

    const clientsByMonth = await this.prisma.$queryRaw<
      { month: string; count: number }[]
    >`
    SELECT TO_CHAR(d, 'YYYY-MM') AS month,
           COALESCE(COUNT(c.id), 0)::int AS count
    FROM generate_series(
           date_trunc('month', NOW() - interval '11 months'),
           date_trunc('month', NOW()),
           interval '1 month'
         ) d
    LEFT JOIN "Client" c
           ON date_trunc('month', c.created_at) = d
          AND c.organization_id = ${orgId}
    GROUP BY d
    ORDER BY d;
  `;

    // Clients by Day (last 30 days, includes 0 days)
    const clientsByDay = await this.prisma.$queryRaw<
      { day: string; count: number }[]
    >`
      SELECT TO_CHAR(d, 'YYYY-MM-DD') AS day,
             COALESCE(COUNT(c.id), 0)::int AS count
      FROM generate_series(
             (CURRENT_DATE - interval '30 days'),
             CURRENT_DATE,
             interval '1 day'
           ) d
      LEFT JOIN "Client" c
             ON date_trunc('day', c.created_at) = d
            AND c.organization_id = ${orgId}
      GROUP BY d
      ORDER BY d;
    `;

    // Clients by Type
    const clientsByType = await this.prisma.$queryRaw<
      { type_id: number; type_name: string; total: number }[]
    >`
      SELECT
        t.id as type_id,
        t.name as type_name,
        COUNT(d.id)::int as total
      FROM "Diagnosis" d
      JOIN "Type" t ON t.id = d.type_id
      JOIN "Client" c ON c.id = d.client_id
      WHERE c.organization_id = ${orgId}
      GROUP BY t.id, t.name
      ORDER BY total DESC;
    `;

    return { clientsByMonth, clientsByDay, clientsByType };
  }

  async getRevenueStats(req: RequestWithUser) {
    const org = req.organization;
    const orgId = org.id;
    // // 1. Revenue by Type
    // const revenueByType = await this.prisma.$queryRaw<
    //   { type_id: number; type_name: string; total: number }[]
    // >`
    //   SELECT c."type_id",
    //          t."name" as type_name,
    //          COALESCE(SUM(c.price), 0)::int as total
    //   FROM "Client" c
    //   JOIN "Type" t ON t.id = c.type_id
    //   WHERE c.organization_id = ${orgId}
    //   GROUP BY c.type_id, t.name
    //   ORDER BY total DESC;
    // `;

    const totalRevenue = await this.prisma.client.aggregate({
      where: {
        organization_id: orgId,
      },
      _sum: {
        price: true,
      },
    });

    // 2. Revenue by Month (always 12 months of before current month)
    const revenueByMonth = await this.prisma.$queryRaw<
      { month: string; total: number }[]
    >`
      SELECT TO_CHAR(months.month, 'YYYY-MM') as month,
             COALESCE(SUM(c.price), 0)::int as total
      FROM generate_series(
              date_trunc('month', CURRENT_DATE) - interval '11 months',
              date_trunc('month', CURRENT_DATE),
              interval '1 month'
           ) as months(month)
      LEFT JOIN "Client" c
             ON TO_CHAR(c.created_at, 'YYYY-MM') = TO_CHAR(months.month, 'YYYY-MM')
            AND c.organization_id = ${orgId}
      GROUP BY months.month
      ORDER BY months.month;
    `;

    // 3. Revenue by Day (always last 30 days, including 0s)
    const revenueByDay = await this.prisma.$queryRaw<
      { day: string; total: number }[]
    >`
    SELECT TO_CHAR(days.day, 'YYYY-MM-DD') as day,
           COALESCE(SUM(c.price), 0)::int as total
    FROM generate_series(
            CURRENT_DATE - interval '29 days',
            CURRENT_DATE,
            interval '1 day'
         ) as days(day)
    LEFT JOIN "Client" c
           ON TO_CHAR(c.created_at, 'YYYY-MM-DD') = TO_CHAR(days.day, 'YYYY-MM-DD')
          AND c.organization_id = ${orgId}
    GROUP BY days.day
    ORDER BY days.day;
  `;

    return { totalRevenue, revenueByMonth, revenueByDay };
  }
}
