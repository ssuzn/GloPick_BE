import { prisma } from "../../db";

interface UpdateUserParams {
  id: number;
  name?: string;
  email?: string;
  birth?: string;
  phone?: string;
  password?: string;
}

export class MyPageUserService {
  static findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        birth: true,
        phone: true,
        password: true,
      },
    });
  }

  static findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static update(data: UpdateUserParams) {
    const { id, ...updateData } = data;

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  static delete(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}