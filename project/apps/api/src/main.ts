import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { AppEnv } from "./config/env.schema";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppEnv, true>>(ConfigService);
  const port = config.get("PORT", { infer: true });
  const webOrigin = config.get("WEB_ORIGIN", { infer: true });

  configureApp(app, webOrigin);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("CertChain Off-Chain Business API")
    .setDescription(
      "API nghiệp vụ phát hành và xác thực chứng chỉ đào tạo (phiên bản off-chain T-023)",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
  const logger = new Logger("Bootstrap");
  logger.log(`API server listening on http://localhost:${port}/v1 (Swagger: /docs)`);
}

void bootstrap();
