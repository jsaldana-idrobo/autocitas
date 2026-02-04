import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module";
import { PublicModule } from "./public/public.module";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/autocitas"),
    AdminModule,
    PublicModule
  ]
})
export class AppModule {}
