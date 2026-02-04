import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  getRoot() {
    return { status: "ok" };
  }

  @Get("health")
  async getHealth() {
    const state = this.connection.readyState;
    let db = "unknown";
    let ping = false;
    if (state === 1) {
      db = "connected";
      try {
        if (this.connection.db) {
          await this.connection.db.admin().ping();
          ping = true;
        }
      } catch {
        ping = false;
      }
    } else if (state === 0) {
      db = "disconnected";
    } else if (state === 2) {
      db = "connecting";
    } else if (state === 3) {
      db = "disconnecting";
    }

    return { status: "ok", db, ping };
  }
}
