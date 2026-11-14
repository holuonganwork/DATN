import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppError } from "./common/errors/app-error";
import { ERROR_CODES } from "./common/errors/error-codes";

export const configureApp = (app: INestApplication, webOrigin: string): void => {
  app.use(helmet());
  app.enableCors({
    origin: webOrigin.split(",").map((item) => item.trim()),
    credentials: true,
  });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) =>
          err.constraints
            ? Object.values(err.constraints)
            : [`Trường ${err.property} không hợp lệ`],
        );
        return new AppError(
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          "Dữ liệu đầu vào không hợp lệ",
          { validationErrors: messages },
        );
      },
    }),
  );
};
