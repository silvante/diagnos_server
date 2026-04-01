import { HttpException, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { randomUUID } from 'crypto';
import * as sharp from 'sharp';
import { NameSanitizerService } from 'src/global/name_sanitizer/name_sanitizer.service';
// import axios from 'axios';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket_name: string;
  private storage_url: string;
  // private storage_zone: string;
  // private storage_key: string;

  constructor(
    private configService: ConfigService,
    private readonly sanitizer: NameSanitizerService,
  ) {
    this.bucket_name = this.configService.get<string>('R2_BUCKET_NAME', '');
    this.storage_url = this.configService.get<string>(
      'R2_RECORDS_ENDPOINT',
      '',
    );
    this.s3 = new S3Client({
      // region: this.configService.get<string>('AWS_S3_REGION', ''),
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT', ''),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get<string>('R2_SECRET_KEY', ''),
      },
    });
    // this.storage_zone = this.configService.get<string>(
    //   'BUNNY_STORAGE_ZONE',
    //   '',
    // );
    // this.storage_key = this.configService.get<string>('BUNNY_STORAGE_KEY', '');
  }

  async uploadAvatar(req: RequestWithUser, file: Express.Multer.File) {
    const user = req.user;
    const folder = 'avatars';
    const filename = this.sanitizer.sanitize(file.originalname);
    const key = `${folder}/${user.username}-${randomUUID()}-${filename}`;
    // const cdn_domain = `${this.storage_zone}.b-cdn.net`;

    let optimisedBuffer: Buffer;

    if (file.mimetype === 'image/svg+xml') {
      throw new HttpException('Avatar uchun SVG fayllariga ruxsat berilmaydi', 404);
    } else {
      optimisedBuffer = await sharp(file.buffer)
        .resize({ width: 400, height: 400 })
        .toFormat('webp', { quality: 40 })
        .toBuffer();
    }

    const mimetype =
      file.mimetype === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
    const validKey = key.endsWith('.webp')
      ? key.replace(/\.[^.]+$/, '.webp')
      : key;

    const command = new PutObjectCommand({
      Bucket: this.bucket_name,
      Key: validKey,
      Body: optimisedBuffer,
      ContentType: mimetype,
    });

    await this.s3.send(command);

    // await axios.put(
    //   `https://storage.bunnycdn.com/${this.storage_zone}/${validKey}`,
    //   optimisedBuffer,
    //   {
    //     headers: {
    //       AccessKey: this.storage_key,
    //       'Content-Type': mimetype,
    //     },
    //   },
    // );

    return `${this.storage_url}/${validKey}`;
  }

  async uploadBanner(req: RequestWithUser, file: Express.Multer.File) {
    const user = req.user;
    const folder = 'banners';
    const filename = this.sanitizer.sanitize(file.originalname);
    const original_key = `${folder}/${user.username}-${randomUUID()}-1280-${filename}`;
    const thumbnail_key = `${folder}/${user.username}-${randomUUID()}-480-${filename}`;
    // const cdn_domain = `${this.storage_zone}.b-cdn.net`;

    let optimisedOriginalBuffer: Buffer;
    let optimisedThumbnailBuffer: Buffer;

    if (file.mimetype === 'image/svg+xml') {
      throw new HttpException('Bannerlar uchun SVG fayllariga ruxsat berilmaydi', 404);
    } else {
      optimisedOriginalBuffer = await sharp(file.buffer)
        .resize({ width: 1280, height: 320 })
        .toFormat('webp', { quality: 80 })
        .toBuffer();

      optimisedThumbnailBuffer = await sharp(file.buffer)
        .resize({ width: 480, height: 120 })
        .toFormat('webp', { quality: 50 })
        .toBuffer();
    }

    const mimetype =
      file.mimetype === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
    const valid_original_key = original_key.endsWith('.webp')
      ? original_key.replace(/\.[^.]+$/, '.webp')
      : original_key;
    const valid_thumbnail_key = thumbnail_key.endsWith('.webp')
      ? thumbnail_key.replace(/\.[^.]+$/, '.webp')
      : thumbnail_key;

    const command_orinal = new PutObjectCommand({
      Bucket: this.bucket_name,
      Key: valid_original_key,
      Body: optimisedOriginalBuffer,
      ContentType: mimetype,
    });

    const command_thumbnail = new PutObjectCommand({
      Bucket: this.bucket_name,
      Key: valid_thumbnail_key,
      Body: optimisedThumbnailBuffer,
      ContentType: mimetype,
    });

    await this.s3.send(command_orinal);
    await this.s3.send(command_thumbnail);

    // return {
    //   original: `https://${this.bucket_name}.s3.amazonaws.com/${command_orinal.input.Key}`,
    //   thumbnail: `https://${this.bucket_name}.s3.amazonaws.com/${command_thumbnail.input.Key}`,
    // };

    // await axios.put(
    //   `https://storage.bunnycdn.com/${this.storage_zone}/${valid_original_key}`,
    //   optimisedOriginalBuffer,
    //   {
    //     headers: {
    //       AccessKey: this.storage_key,
    //       'Content-Type': mimetype,
    //     },
    //   },
    // );

    // await axios.put(
    //   `https://storage.bunnycdn.com/${this.storage_zone}/${valid_thumbnail_key}`,
    //   optimisedThumbnailBuffer,
    //   {
    //     headers: {
    //       AccessKey: this.storage_key,
    //       'Content-Type': mimetype,
    //     },
    //   },
    // );

    return {
      original: `${this.storage_url}/${valid_original_key}`,
      thumbnail: `${this.storage_url}/${valid_thumbnail_key}`,
    };
  }

  async uploadLogo(req: RequestWithUser, file: Express.Multer.File) {
    const user = req.user;
    const folder = 'logos';
    const filename = this.sanitizer.sanitize(file.originalname);
    const key = `${folder}/${user.username}-${randomUUID()}-${filename}`;
    // const cdn_domain = `${this.storage_zone}.b-cdn.net`;

    let optimisedBuffer: Buffer;

    if (file.mimetype === 'image/svg+xml') {
      optimisedBuffer = file.buffer;
    } else {
      optimisedBuffer = await sharp(file.buffer)
        .resize({ height: 200 })
        .toFormat('webp', { quality: 80 })
        .toBuffer();
    }

    const mimetype =
      file.mimetype === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp';
    const validKey = key.endsWith('.webp')
      ? key.replace(/\.[^.]+$/, '.webp')
      : key;

    const command = new PutObjectCommand({
      Bucket: this.bucket_name,
      Key: validKey,
      Body: optimisedBuffer,
      ContentType: mimetype,
    });

    await this.s3.send(command);

    // await axios.put(
    //   `https://storage.bunnycdn.com/${this.storage_zone}/${validKey}`,
    //   optimisedBuffer,
    //   {
    //     headers: {
    //       AccessKey: this.storage_key,
    //       'Content-Type': mimetype,
    //     },
    //   },
    // );

    return `${this.storage_url}/${validKey}`;
  }
}
