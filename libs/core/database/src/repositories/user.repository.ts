import { Prisma, User, UserRole } from '@prisma/client';
import { prisma } from '../prisma';

export const userRepository = {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { clientAccount: true },
    });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { clientAccount: true },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    role?: UserRole;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ data: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {};
    if (params?.role) where.role = params.role;

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where });
  },
};
