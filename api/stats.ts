import client from "./client";
import type { TaskStats } from "../types";

type StatsResponse = { success: boolean; data: TaskStats };

export const fetchStats = (): Promise<TaskStats> =>
  client.get<StatsResponse>("/task/stats").then((r) => r.data.data);
