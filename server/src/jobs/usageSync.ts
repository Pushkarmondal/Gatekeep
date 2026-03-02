import { prisma } from "../../db";
import { redis } from "../redisconnection/connection";

export async function syncUsageToDB() {
  // TODO: Implement usage sync logic
  const keys = await redis.keys("*");
  console.log("Syncing usage to DB...");
  for (const key of keys) {
    const parts = key.split(":");
    const userId = parts[1];
    const period = parts[2];

    const count = await redis.get(key);
    if (!count) {
      continue;
    }
    await prisma.usageRecord.upsert({
      where: {
        userId_period: {
          userId: userId!,
          period: period!,
        },
      },
      update: {
        count: Number(count),
      },
      create: {
        userId: userId!,
        period: period!,
        count: Number(count),
      },
    });
  }
  console.log(keys);
}
