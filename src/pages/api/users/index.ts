import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  const { email, name, avatar, password } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing or invalid user ID" });
  }

  try {
    const updateData: {
      email?: string;
      name?: string;
      avatar?: number;
      password?: string;
    } = {};

    // Validate and prepare optional fields
    if (email) {
      // Check if email already exists for another user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updateData.email = email;
    }

    if (name) {
      updateData.name = name;
    }

    if (avatar !== undefined) {
      const avatarNum = Number(avatar);
      if (isNaN(avatarNum)) {
        return res.status(400).json({ message: "Invalid avatar value" });
      }
      updateData.avatar = avatarNum;
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Ensure there's at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ message: "User updated", user: updatedUser });
  } catch (error) {
    console.error("[UPDATE_USER]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
